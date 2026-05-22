using System.Text.Json.Serialization;

namespace BankTracker.API.Models.DTOs;

public class BasiqTokenResponse
{
    [JsonPropertyName("access_token")]
    public string AccessToken { get; set; } = string.Empty;

    [JsonPropertyName("token_type")]
    public string TokenType { get; set; } = string.Empty;

    [JsonPropertyName("expires_in")]
    public int ExpiresIn { get; set; }
}

public class BasiqUserResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;
}

public class BasiqAuthLinkResponse
{
    [JsonPropertyName("data")]
    public BasiqAuthLinkData Data { get; set; } = new();
}

public class BasiqAuthLinkData
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("expiresAt")]
    public string ExpiresAt { get; set; } = string.Empty;

    [JsonPropertyName("links")]
    public BasiqAuthLinkLinks Links { get; set; } = new();
}

public class BasiqAuthLinkLinks
{
    [JsonPropertyName("public")]
    public string Public { get; set; } = string.Empty;
}

public class BasiqAccountsResponse
{
    [JsonPropertyName("data")]
    public List<BasiqAccountData> Data { get; set; } = new();
}

public class BasiqAccountData
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("currency")]
    public string Currency { get; set; } = "AUD";

    [JsonPropertyName("institution")]
    public string Institution { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("balance")]
    public string Balance { get; set; } = "0";

    [JsonPropertyName("availableFunds")]
    public string? AvailableFunds { get; set; }

    [JsonPropertyName("accountNo")]
    public string? AccountNo { get; set; }

    [JsonPropertyName("class")]
    public BasiqAccountClass? Class { get; set; }
}

public class BasiqAccountClass
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("product")]
    public string? Product { get; set; }
}

public class BasiqTransactionsResponse
{
    [JsonPropertyName("data")]
    public List<BasiqTransactionData> Data { get; set; } = new();

    [JsonPropertyName("links")]
    public BasiqPaginationLinks? Links { get; set; }
}

public class BasiqPaginationLinks
{
    [JsonPropertyName("next")]
    public string? Next { get; set; }
}

public class BasiqTransactionData
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("amount")]
    public string Amount { get; set; } = "0";

    [JsonPropertyName("account")]
    public string Account { get; set; } = string.Empty;

    [JsonPropertyName("balance")]
    public string? Balance { get; set; }

    [JsonPropertyName("direction")]
    public string Direction { get; set; } = "debit";

    [JsonPropertyName("institution")]
    public string Institution { get; set; } = string.Empty;

    [JsonPropertyName("date")]
    public string Date { get; set; } = string.Empty;

    [JsonPropertyName("postDate")]
    public string? PostDate { get; set; }

    [JsonPropertyName("enrich")]
    public BasiqEnrich? Enrich { get; set; }
}

public class BasiqEnrich
{
    [JsonPropertyName("cleanDescription")]
    public string? CleanDescription { get; set; }

    [JsonPropertyName("category")]
    public BasiqCategory? Category { get; set; }

    [JsonPropertyName("merchant")]
    public BasiqMerchant? Merchant { get; set; }
}

public class BasiqCategory
{
    [JsonPropertyName("anzsic")]
    public BasiqAnzsic? Anzsic { get; set; }
}

public class BasiqAnzsic
{
    [JsonPropertyName("title")]
    public string? Title { get; set; }

    [JsonPropertyName("division")]
    public string? Division { get; set; }
}

public class BasiqMerchant
{
    [JsonPropertyName("businessName")]
    public string? BusinessName { get; set; }

    [JsonPropertyName("logoMaster")]
    public string? LogoMaster { get; set; }
}

public class AnthropicResponse
{
    [JsonPropertyName("content")]
    public List<AnthropicContent> Content { get; set; } = new();
}

public class AnthropicContent
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;
}
