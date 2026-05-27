using Microsoft.EntityFrameworkCore;
using BankTracker.API.Data;
using BankTracker.API.Models;
using BankTracker.API.Models.DTOs;

namespace BankTracker.API.Services;

public class TransactionService : ITransactionService
{
    private readonly AppDbContext _db;
    private readonly IBasiqService _basiq;
    private readonly IClaudeService _claude;
    private readonly ILogger<TransactionService> _logger;

    public TransactionService(AppDbContext db, IBasiqService basiq, IClaudeService claude, ILogger<TransactionService> logger)
    {
        _db = db;
        _basiq = basiq;
        _claude = claude;
        _logger = logger;
    }

    public async Task<SyncResponse> SyncAsync(Guid userId)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("User not found");

        if (string.IsNullOrEmpty(user.BasiqUserId))
            throw new InvalidOperationException("No Basiq account linked. Please connect a bank account first.");

        var accountsUpdated = 0;
        var transactionsAdded = 0;
        var transactionsUpdated = 0;

        // Sync accounts
        var basiqAccounts = await _basiq.GetAccountsAsync(user.BasiqUserId);
        foreach (var ba in basiqAccounts)
        {
            var existing = await _db.BankAccounts
                .FirstOrDefaultAsync(a => a.BasiqAccountId == ba.Id && a.UserId == userId);

            if (existing == null)
            {
                _db.BankAccounts.Add(new BankAccount
                {
                    UserId = userId,
                    BasiqAccountId = ba.Id,
                    Name = ba.Name,
                    AccountNumber = ba.AccountNo,
                    Type = ba.Class?.Type ?? "unknown",
                    Institution = ba.Institution,
                    Balance = decimal.TryParse(ba.Balance, out var bal) ? bal : 0,
                    AvailableFunds = decimal.TryParse(ba.AvailableFunds, out var avail) ? avail : null,
                    Status = ba.Status,
                    Currency = ba.Currency,
                    LastSynced = DateTime.UtcNow
                });
            }
            else
            {
                existing.Balance = decimal.TryParse(ba.Balance, out var bal) ? bal : existing.Balance;
                existing.AvailableFunds = decimal.TryParse(ba.AvailableFunds, out var avail) ? avail : existing.AvailableFunds;
                existing.Status = ba.Status;
                existing.LastSynced = DateTime.UtcNow;
            }
            accountsUpdated++;
        }
        await _db.SaveChangesAsync();

        // Sync transactions (last 90 days for initial, last 7 days for refresh)
        var lastSync = await _db.BankAccounts
            .Where(a => a.UserId == userId)
            .MaxAsync(a => (DateTime?)a.LastSynced);
        var fromDate = lastSync.HasValue && (DateTime.UtcNow - lastSync.Value).TotalDays < 1
            ? DateTime.UtcNow.AddDays(-7)
            : DateTime.UtcNow.AddDays(-90);

        var basiqTransactions = await _basiq.GetTransactionsAsync(user.BasiqUserId, fromDate);
        var accountMap = await _db.BankAccounts
            .Where(a => a.UserId == userId)
            .ToDictionaryAsync(a => a.BasiqAccountId, a => a.Id);

        foreach (var bt in basiqTransactions)
        {
            if (!accountMap.TryGetValue(bt.Account, out var accountId))
                continue;

            var existing = await _db.Transactions
                .FirstOrDefaultAsync(t => t.BasiqTransactionId == bt.Id);

            if (existing == null)
            {
                var merchantName = bt.Enrich?.Merchant?.BusinessName ?? bt.Enrich?.CleanDescription;
                var basiqCategory = bt.Enrich?.Category?.Anzsic?.Title;

                _db.Transactions.Add(new Transaction
                {
                    UserId = userId,
                    BankAccountId = accountId,
                    BasiqTransactionId = bt.Id,
                    Amount = decimal.TryParse(bt.Amount, out var amt) ? amt : 0,
                    Description = bt.Description,
                    MerchantName = merchantName,
                    Date = DateTime.TryParse(bt.Date, out var date) ? date : DateTime.UtcNow,
                    PostDate = DateTime.TryParse(bt.PostDate, out var post) ? post : null,
                    BasiqCategory = basiqCategory,
                    IsPending = bt.Status == "pending",
                    Direction = bt.Direction
                });
                transactionsAdded++;
            }
            else
            {
                existing.IsPending = bt.Status == "pending";
                if (decimal.TryParse(bt.Amount, out var amt))
                    existing.Amount = amt;
                transactionsUpdated++;
            }
        }

        await _db.SaveChangesAsync();

        // Auto-categorize new transactions without a category
        await CategorizeUncategorizedAsync(userId);

        return new SyncResponse(accountsUpdated, transactionsAdded, transactionsUpdated);
    }

    public async Task<TransactionListResponse> GetTransactionsAsync(Guid userId, TransactionFilter filter)
    {
        var query = _db.Transactions
            .Include(t => t.BankAccount)
            .Where(t => t.UserId == userId);

        if (!string.IsNullOrEmpty(filter.Category))
            query = query.Where(t =>
                t.UserCategory == filter.Category ||
                (t.UserCategory == null && t.AiCategory == filter.Category) ||
                (t.UserCategory == null && t.AiCategory == null && t.BasiqCategory == filter.Category));

        if (!string.IsNullOrEmpty(filter.SearchTerm))
            query = query.Where(t =>
                t.Description.Contains(filter.SearchTerm) ||
                (t.MerchantName != null && t.MerchantName.Contains(filter.SearchTerm)));

        if (filter.FromDate.HasValue)
            query = query.Where(t => t.Date >= filter.FromDate.Value);

        if (filter.ToDate.HasValue)
            query = query.Where(t => t.Date <= filter.ToDate.Value);

        if (filter.AccountId.HasValue)
            query = query.Where(t => t.BankAccountId == filter.AccountId.Value);

        if (!string.IsNullOrEmpty(filter.Direction))
            query = query.Where(t => t.Direction == filter.Direction);

        var total = await query.CountAsync();
        var totalSpent = await query.Where(t => t.Direction == "debit").SumAsync(t => Math.Abs(t.Amount));
        var totalIncome = await query.Where(t => t.Direction == "credit").SumAsync(t => Math.Abs(t.Amount));

        var allForCategories = await query.ToListAsync();
        var spendingByCategory = allForCategories
            .Where(t => t.Direction == "debit")
            .GroupBy(t => t.EffectiveCategory)
            .ToDictionary(g => g.Key, g => g.Sum(t => Math.Abs(t.Amount)));

        var transactions = await query
            .OrderByDescending(t => t.Date)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(t => new TransactionDto(
                t.Id,
                t.BasiqTransactionId,
                t.Amount,
                t.Description,
                t.MerchantName,
                t.Date,
                t.BasiqCategory,
                t.AiCategory,
                t.UserCategory,
                t.EffectiveCategory,
                t.IsUserEdited,
                t.IsPending,
                t.Direction,
                t.BankAccountId,
                t.BankAccount.Name,
                t.BankAccount.Institution))
            .ToListAsync();

        return new TransactionListResponse(transactions, total, totalSpent, totalIncome, spendingByCategory);
    }

    public async Task UpdateCategoryAsync(Guid transactionId, Guid userId, string category)
    {
        var transaction = await _db.Transactions
            .FirstOrDefaultAsync(t => t.Id == transactionId && t.UserId == userId)
            ?? throw new KeyNotFoundException("Transaction not found");

        transaction.UserCategory = category;
        transaction.IsUserEdited = true;
        await _db.SaveChangesAsync();

        // Learn from this: update similar uncategorized transactions from same merchant
        if (!string.IsNullOrEmpty(transaction.MerchantName))
        {
            var similar = await _db.Transactions
                .Where(t => t.UserId == userId
                    && t.MerchantName == transaction.MerchantName
                    && !t.IsUserEdited
                    && t.AiCategory == null)
                .ToListAsync();

            foreach (var s in similar)
                s.AiCategory = category;

            await _db.SaveChangesAsync();
        }
    }

    public async Task<int> CategorizeUncategorizedAsync(Guid userId)
    {
        var uncategorized = await _db.Transactions
            .Where(t => t.UserId == userId && t.AiCategory == null && !t.IsUserEdited)
            .Take(100)
            .ToListAsync();

        if (!uncategorized.Any()) return 0;

        // Get past user-edited categorizations for context
        var pastCategorizations = await _db.Transactions
            .Where(t => t.UserId == userId && t.IsUserEdited)
            .OrderByDescending(t => t.Date)
            .Take(50)
            .Select(t => new { t.Description, Category = t.UserCategory ?? t.AiCategory ?? "Other" })
            .ToListAsync();

        var similar = pastCategorizations
            .Select(p => (p.Description, p.Category))
            .ToList();

        // Batch categorize in groups of 20
        var count = 0;
        for (var i = 0; i < uncategorized.Count; i += 20)
        {
            var batch = uncategorized.Skip(i).Take(20).ToList();
            var input = batch.Select(t => (t.Id.ToString(), t.Description, t.MerchantName, t.Amount, t.Direction));
            var categories = await _claude.CategorizeTransactionsBatchAsync(input);

            foreach (var tx in batch)
            {
                if (categories.TryGetValue(tx.Id.ToString(), out var cat))
                {
                    tx.AiCategory = cat;
                    count++;
                }
            }
        }

        await _db.SaveChangesAsync();
        return count;
    }
}
