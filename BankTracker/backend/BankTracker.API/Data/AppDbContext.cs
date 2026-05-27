using Microsoft.EntityFrameworkCore;
using BankTracker.API.Models;

namespace BankTracker.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<BankAccount> BankAccounts { get; set; }
    public DbSet<Transaction> Transactions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<BankAccount>()
            .HasIndex(a => a.BasiqAccountId)
            .IsUnique();

        modelBuilder.Entity<Transaction>()
            .HasIndex(t => t.BasiqTransactionId)
            .IsUnique();

        modelBuilder.Entity<Transaction>()
            .Property(t => t.Amount)
            .HasColumnType("decimal(18,2)");

        modelBuilder.Entity<BankAccount>()
            .Property(a => a.Balance)
            .HasColumnType("decimal(18,2)");

        modelBuilder.Entity<BankAccount>()
            .Property(a => a.AvailableFunds)
            .HasColumnType("decimal(18,2)");
    }
}
