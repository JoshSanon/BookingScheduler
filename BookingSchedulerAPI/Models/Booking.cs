namespace BookingScheduler.BookingSchedulerAPI.Models
{
    public class Booking
    {
        public Guid BookingId { get; set; }
        public TimeSpan BookingTime {get; set;}
        public required string Name {get; set;}
    }
}