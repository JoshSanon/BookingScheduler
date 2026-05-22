namespace BankTracker.API.Models;

public class BankAccount
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string BasiqAccountId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? AccountNumber { get; set; }
    public string Type { get; set; } = string.Empty;
    public string? Institution { get; set; }
    public decimal Balance { get; set; }
    public decimal? AvailableFunds { get; set; }
    public string Status { get; set; } = "active";
    public string Currency { get; set; } = "AUD";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastSynced { get; set; }

    public User User { get; set; } = null!;
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
