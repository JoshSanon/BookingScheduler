namespace BankTracker.API.Models;

public class Transaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid BankAccountId { get; set; }
    public string BasiqTransactionId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? MerchantName { get; set; }
    public DateTime Date { get; set; }
    public DateTime? PostDate { get; set; }
    public string? BasiqCategory { get; set; }
    public string? AiCategory { get; set; }
    public string? UserCategory { get; set; }
    public bool IsUserEdited { get; set; } = false;
    public bool IsPending { get; set; } = false;
    public string Direction { get; set; } = "debit";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public BankAccount BankAccount { get; set; } = null!;

    public string EffectiveCategory => UserCategory ?? AiCategory ?? BasiqCategory ?? "Other";
}
