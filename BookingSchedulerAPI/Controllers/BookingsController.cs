using Microsoft.AspNetCore.Mvc;
using BookingScheduler.BookingSchedulerAPI.Models;

namespace BookingScheduler.BookingSchedulerAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookingsController : ControllerBase
    {
        private static readonly List<Booking> Bookings = [];
        private const int MaxSimultaneousBookings = 4;
        private TimeSpan StartingBusinessTime = TimeSpan.FromHours(9);
        private TimeSpan ClosingBusinessTime = TimeSpan.FromHours(16);

        [HttpPost]
        public IActionResult CreateBooking([FromBody] BookingRequest request)
        {
            //Checks to make sure the Request has valid values.
            if (string.IsNullOrEmpty(request.Name))
            {
                return BadRequest("Name must be a non-empty string.");
            }

            if (!TimeSpan.TryParse(request.BookingTime, out var bookingTime))
            {
                return BadRequest("Invalid booking Time Format");
            } 

            if(bookingTime < StartingBusinessTime || bookingTime > ClosingBusinessTime)
            {
                return BadRequest("The booking time selected is out of business hours");
            }

            //Check if new booking exceeds the maximum simultaneous booking at any time during the session.
            if (Bookings.Count(b => DoesSettlementOverLap(b.BookingTime, bookingTime)) >= MaxSimultaneousBookings)
            {
                return Conflict("All bookings at this time are reserved.");
            }

            //Adding the new booking in memory and returning an OK response with the BookingId guid.
            var newBooking = new Booking {BookingId = Guid.NewGuid(), Name = request.Name, BookingTime = bookingTime};
            Bookings.Add(newBooking);
            var response = new BookingResponse { BookingId = newBooking.BookingId };
            return Ok(response);
        }

        //A GET Api endpoint which helps viewing the bookings made. Adding a little love to the project!
        [HttpGet]
        public IActionResult DisplayBooking()
        {
            return Ok(Bookings);
        }

        //Helper method to Check if the booking times have overlapped. 
        //This accounts for the following case: 
        //booking starting at 9:00 (ends at 9:59) does not overlap with booking starting at 10:00.
        private bool DoesSettlementOverLap(TimeSpan bookedInTime, TimeSpan newTimeToBeBooked){
            return bookedInTime < newTimeToBeBooked + TimeSpan.FromHours(1) && newTimeToBeBooked < bookedInTime + TimeSpan.FromHours(1);
        }
    }
}
