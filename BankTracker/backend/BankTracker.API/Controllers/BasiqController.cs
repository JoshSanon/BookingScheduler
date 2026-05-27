using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BankTracker.API.Data;
using BankTracker.API.Models.DTOs;
using BankTracker.API.Services;

namespace BankTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BasiqController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IBasiqService _basiq;
    private readonly ITransactionService _transactions;

    public BasiqController(AppDbContext db, IBasiqService basiq, ITransactionService transactions)
    {
        _db = db;
        _basiq = basiq;
        _transactions = transactions;
    }

    [HttpPost("auth-link")]
    public async Task<ActionResult<AuthLinkResponse>> GetAuthLink([FromQuery] string? redirectUri = null)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return Unauthorized();

        if (string.IsNullOrEmpty(user.BasiqUserId))
        {
            user.BasiqUserId = await _basiq.CreateUserAsync(
                user.Email, user.FirstName, user.LastName, user.Mobile);
            await _db.SaveChangesAsync();
        }

        var redirect = redirectUri ?? "http://localhost:5173/accounts?connected=true";
        var (authUrl, expiresAt) = await _basiq.GetAuthLinkAsync(user.BasiqUserId, redirect);

        return Ok(new AuthLinkResponse(authUrl, expiresAt));
    }

    [HttpPost("sync")]
    public async Task<ActionResult<SyncResponse>> Sync()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        try
        {
            var result = await _transactions.SyncAsync(userId);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
