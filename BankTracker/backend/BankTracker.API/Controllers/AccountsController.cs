using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BankTracker.API.Data;
using BankTracker.API.Models.DTOs;

namespace BankTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AccountsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AccountsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<AccountDto>>> GetAccounts()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var accounts = await _db.BankAccounts
            .Where(a => a.UserId == userId)
            .Select(a => new AccountDto(
                a.Id,
                a.BasiqAccountId,
                a.Name,
                a.AccountNumber,
                a.Type,
                a.Institution,
                a.Balance,
                a.AvailableFunds,
                a.Status,
                a.Currency,
                a.LastSynced,
                a.Transactions.Count))
            .ToListAsync();

        return Ok(accounts);
    }
}
