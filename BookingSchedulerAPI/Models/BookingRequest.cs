namespace BookingScheduler.BookingSchedulerAPI.Models
{
    public class BookingRequest
    {
        public required string BookingTime { get; set; }
        public required string Name { get; set; }
    }
}