# InfoTrack Booking API

InfoTrack Booking API is a simple booking system for property settlements. It allows clients to book settlement times, ensuring a limited number of simultaneous settlements.
The API handles booking requests, validates them, and returns appropriate responses based on availability and input validation.

## Requirements

- .NET 6.0 or later

### Prerequisites

Ensure you have the following installed on your development machine:

- .NET 6.0 SDK or later
- An HTTP client like Postman for testing

### Restore dependencies:
```
dotnet restore
```

## Running the Application
Change directory to \BookingSchedulerApi 
Build and run the application:
```
dotnet run
```
By default, the application will run on http://localhost:5000.
You can change the port by modifying the launchSettings.json file.

## Configuration
Configuring the Port
Using launchSettings.json:
Modify Properties/launchSettings.json to set your desired ports:

```
   "profiles": {
    "http": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": true,
      "launchUrl": "swagger",
      "applicationUrl": "http://localhost:5000",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    },
```

## API Endpoints
### Create Booking-
- URL: POST /api/bookings
-Request Body example:

```
{
  "bookingTime": "09:30",
  "name": "John Smith"
}
```

Responses:
- 200 OK:
```
{
  "bookingId": "d90f8c55-90a5-4537-a99d-c68242a6012b"
}
```
- 400 Bad Request (Empty Name):
```
{
  "error": "Name must be a non-empty string."
}
```
- 400 Bad Request (Invalid data):
```
{
  "error": "Invalid booking Time Format"
}
```
- 400 Bad Request (Out of hours):
```
{
  "error": "The booking time selected is out of business hours"
}
```
409 Conflict:
```
{
  "error": "All bookings at this time are reserved."
}
```
### View Bookings
- URL: GET /api/bookings
- 200 Ok:
```
[
    {
        "bookingId": "84726646-c010-46ad-bdaf-20270b3b77b8",
        "bookingTime": "11:35:00",
        "name": "Jack Smith"
    },
    {
        "bookingId": "e0d5d056-c3d5-4540-8e55-08c0a4bfda22",
        "bookingTime": "13:35:00",
        "name": "John Cena"
    }
]

```

## Testing the API
Using Postman
Open Postman and create a new POST request.

Set the URL to http://localhost:5000/api/bookings. (Or whatever port you have set in launchSettings.json

Set the request body to:

```
{
  "bookingTime": "10:30",
  "name": "John Smith"
}
```
Send the request and check the response.

## Project Structure
- Program.cs: Entry point of the application.
- Controllers/BookingsController.cs: API controller handling booking requests.
- Models/BookingRequest.cs: Model for booking request.
- Models/BookingResponse.cs: Model for booking response.
- Models/Booking.cs: Model for storing Bookings in memory.
- Properties/launchSettings.json: Configuration file for launch settings.
