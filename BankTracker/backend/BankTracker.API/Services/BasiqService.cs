using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using BankTracker.API.Models.DTOs;

namespace BankTracker.API.Services;

public class BasiqService : IBasiqService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;
    private readonly ILogger<BasiqService> _logger;
    private string? _accessToken;
    private DateTime _tokenExpiry = DateTime.MinValue;

    public BasiqService(IHttpClientFactory httpClientFactory, IConfiguration config, ILogger<BasiqService> logger)
    {
        _httpClient = httpClientFactory.CreateClient("Basiq");
        _config = config;
        _logger = logger;
    }

    private async Task<string> GetTokenAsync()
    {
        if (_accessToken != null && DateTime.UtcNow < _tokenExpiry)
            return _accessToken;

        var apiKey = _config["Basiq:ApiKey"] ?? throw new InvalidOperationException("Basiq:ApiKey not configured");
        var encoded = Convert.ToBase64String(Encoding.UTF8.GetBytes(apiKey + ":"));

        var request = new HttpRequestMessage(HttpMethod.Post, "/token");
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", encoded);
        request.Headers.Add("basiq-version", "3.0");
        request.Content = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("scope", "SERVER_ACCESS"),
            new KeyValuePair<string, string>("grant_type", "client_credentials")
        });

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        var data = await response.Content.ReadFromJsonAsync<BasiqTokenResponse>();
        _accessToken = data!.AccessToken;
        _tokenExpiry = DateTime.UtcNow.AddSeconds(data.ExpiresIn - 60);
        return _accessToken;
    }

    private async Task<HttpRequestMessage> CreateRequestAsync(HttpMethod method, string path)
    {
        var token = await GetTokenAsync();
        var request = new HttpRequestMessage(method, path);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Headers.Add("basiq-version", "3.0");
        return request;
    }

    public async Task<string> CreateUserAsync(string email, string firstName, string lastName, string? mobile)
    {
        var request = await CreateRequestAsync(HttpMethod.Post, "/users");
        var body = new { email, firstName, lastName, mobile };
        request.Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        var user = await response.Content.ReadFromJsonAsync<BasiqUserResponse>();
        return user!.Id;
    }

    public async Task<(string AuthUrl, DateTime ExpiresAt)> GetAuthLinkAsync(string basiqUserId, string redirectUri)
    {
        var request = await CreateRequestAsync(HttpMethod.Post, $"/users/{basiqUserId}/auth_link");
        var body = new { mobile = (string?)null };
        request.Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<BasiqAuthLinkResponse>();
        var expiresAt = DateTime.TryParse(result!.Data.ExpiresAt, out var dt) ? dt : DateTime.UtcNow.AddMinutes(15);
        var authUrl = result.Data.Links.Public;

        if (!string.IsNullOrEmpty(redirectUri))
            authUrl += $"&redirect_uri={Uri.EscapeDataString(redirectUri)}";

        return (authUrl, expiresAt);
    }

    public async Task<List<BasiqAccountData>> GetAccountsAsync(string basiqUserId)
    {
        var request = await CreateRequestAsync(HttpMethod.Get, $"/users/{basiqUserId}/accounts");
        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<BasiqAccountsResponse>();
        return result?.Data ?? new List<BasiqAccountData>();
    }

    public async Task<List<BasiqTransactionData>> GetTransactionsAsync(string basiqUserId, DateTime? fromDate = null)
    {
        var allTransactions = new List<BasiqTransactionData>();
        var url = $"/users/{basiqUserId}/transactions?limit=500";
        if (fromDate.HasValue)
            url += $"&filter=transaction.postDate.gt('{fromDate.Value:yyyy-MM-dd}')";

        while (!string.IsNullOrEmpty(url))
        {
            var request = await CreateRequestAsync(HttpMethod.Get, url);
            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to fetch transactions from Basiq: {Status}", response.StatusCode);
                break;
            }

            var result = await response.Content.ReadFromJsonAsync<BasiqTransactionsResponse>();
            if (result?.Data != null)
                allTransactions.AddRange(result.Data);

            url = result?.Links?.Next;
        }

        return allTransactions;
    }
}
