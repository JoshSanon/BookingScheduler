using System.Text;
using System.Text.Json;
using BankTracker.API.Models.DTOs;

namespace BankTracker.API.Services;

public class ClaudeService : IClaudeService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;
    private readonly ILogger<ClaudeService> _logger;

    private static readonly string[] Categories =
    [
        "Groceries", "Dining & Restaurants", "Shopping", "Transport", "Fuel",
        "Entertainment", "Health & Medical", "Utilities & Bills", "Insurance",
        "Subscriptions", "Rent & Mortgage", "Travel", "Education",
        "Personal Care", "Income", "Transfer", "Investments", "Government", "Other"
    ];

    public ClaudeService(IHttpClientFactory httpClientFactory, IConfiguration config, ILogger<ClaudeService> logger)
    {
        _httpClient = httpClientFactory.CreateClient("Anthropic");
        _config = config;
        _logger = logger;
    }

    public async Task<string> CategorizeTransactionAsync(
        string description,
        string? merchantName,
        decimal amount,
        string direction,
        IEnumerable<(string Description, string Category)> similarTransactions)
    {
        var categoryList = string.Join(", ", Categories);
        var similar = similarTransactions.Take(5).ToList();
        var pastExamples = similar.Count > 0
            ? "\n\nPast categorisations from this user:\n" + string.Join("\n", similar.Select(s => $"- \"{s.Description}\" → {s.Category}"))
            : "";

        var prompt = $"""
            Categorise this Australian bank transaction into exactly one of these categories:
            {categoryList}

            Transaction:
            - Description: {description}
            - Merchant: {merchantName ?? "unknown"}
            - Amount: ${Math.Abs(amount):F2} AUD ({direction})
            {pastExamples}

            Reply with ONLY the category name, nothing else.
            """;

        try
        {
            var result = await CallClaudeAsync(prompt);
            var trimmed = result.Trim();
            return Categories.Contains(trimmed) ? trimmed : "Other";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to categorize transaction: {Description}", description);
            return "Other";
        }
    }

    public async Task<Dictionary<string, string>> CategorizeTransactionsBatchAsync(
        IEnumerable<(string Id, string Description, string? MerchantName, decimal Amount, string Direction)> transactions)
    {
        var txList = transactions.ToList();
        if (!txList.Any()) return new Dictionary<string, string>();

        var categoryList = string.Join(", ", Categories);
        var txLines = string.Join("\n", txList.Select((t, i) =>
            $"{i + 1}. ID={t.Id} | {t.Description} | {t.MerchantName ?? "unknown"} | ${Math.Abs(t.Amount):F2} ({t.Direction})"));

        var prompt = $"""
            Categorise each of these Australian bank transactions into exactly one category.
            Available categories: {categoryList}

            Transactions:
            {txLines}

            Reply with ONLY a JSON object mapping each ID to its category, like:
            {{"id1": "Groceries", "id2": "Dining & Restaurants"}}
            """;

        try
        {
            var result = await CallClaudeAsync(prompt);
            var json = ExtractJson(result);
            var parsed = JsonSerializer.Deserialize<Dictionary<string, string>>(json) ?? new();
            foreach (var key in parsed.Keys.ToList())
            {
                if (!Categories.Contains(parsed[key]))
                    parsed[key] = "Other";
            }
            return parsed;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to batch categorize {Count} transactions", txList.Count);
            return txList.ToDictionary(t => t.Id, _ => "Other");
        }
    }

    private async Task<string> CallClaudeAsync(string prompt)
    {
        var apiKey = _config["Anthropic:ApiKey"] ?? throw new InvalidOperationException("Anthropic:ApiKey not configured");

        var requestBody = new
        {
            model = "claude-opus-4-7",
            max_tokens = 1024,
            messages = new[] { new { role = "user", content = prompt } }
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "/v1/messages");
        request.Headers.Add("x-api-key", apiKey);
        request.Headers.Add("anthropic-version", "2023-06-01");
        request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<AnthropicResponse>();
        return result?.Content.FirstOrDefault()?.Text ?? "Other";
    }

    private static string ExtractJson(string text)
    {
        var start = text.IndexOf('{');
        var end = text.LastIndexOf('}');
        return start >= 0 && end > start ? text[start..(end + 1)] : "{}";
    }
}
