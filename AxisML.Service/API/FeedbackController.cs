using Microsoft.AspNetCore.Mvc;
using AxisML.Service.Data;

namespace AxisML.Service.API;

[ApiController]
[Route("api/[controller]")]
public class FeedbackController : ControllerBase
{
    private readonly TrainingDataContext _dataContext;

    public FeedbackController(TrainingDataContext dataContext)
    {
        _dataContext = dataContext;
    }

    [HttpPost("priority")]
    public IActionResult SetPriority([FromBody] PriorityFeedback feedback)
    {
        _dataContext.SaveUserFeedback(feedback.EmailId, feedback.UserEmail, priority: feedback.Priority);
        return Ok(new { message = "Priority saved" });
    }

    [HttpPost("needs-response")]
    public IActionResult SetNeedsResponse([FromBody] NeedsResponseFeedback feedback)
    {
        _dataContext.SaveUserFeedback(feedback.EmailId, feedback.UserEmail, needsResponse: feedback.NeedsResponse);
        return Ok(new { message = "Needs response flag saved" });
    }

    [HttpPost("snooze")]
    public IActionResult SnoozeEmail([FromBody] SnoozeFeedback feedback)
    {
        _dataContext.SaveUserFeedback(feedback.EmailId, feedback.UserEmail, snoozedUntil: feedback.SnoozedUntil);
        return Ok(new { message = "Email snoozed" });
    }

    [HttpGet("all")]
    public IActionResult GetFeedback([FromQuery] string userEmail)
    {
        var feedback = _dataContext.GetUserFeedback(userEmail);
        return Ok(feedback);
    }
}

public record PriorityFeedback(string EmailId, string UserEmail, string Priority);
public record NeedsResponseFeedback(string EmailId, string UserEmail, bool NeedsResponse);
public record SnoozeFeedback(string EmailId, string UserEmail, DateTime SnoozedUntil);
