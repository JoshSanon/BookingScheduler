namespace BankTracker.API.Models.DTOs;

public record RegisterRequest(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string? Mobile = null);

public record LoginRequest(string Email, string Password);

public record AuthResponse(
    string Token,
    string Email,
    string FirstName,
    string LastName,
    Guid UserId);
