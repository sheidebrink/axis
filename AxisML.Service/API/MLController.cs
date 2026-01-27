using Microsoft.AspNetCore.Mvc;
using AxisML.Service.Models;
using AxisML.Service.Services;

namespace AxisML.Service.API;

[ApiController]
[Route("api/[controller]")]
public class MLController : ControllerBase
{
    private readonly EmailPredictionService _predictionService;

    public MLController(EmailPredictionService predictionService)
    {
        _predictionService = predictionService;
    }

    [HttpPost("analyze")]
    public ActionResult<EmailInsightsResponse> AnalyzeEmail([FromBody] EmailInsightsRequest request, [FromQuery] string? userEmail = null)
    {
        if (string.IsNullOrEmpty(userEmail))
        {
            return BadRequest(new { error = "userEmail query parameter is required" });
        }
        
        var insights = _predictionService.AnalyzeEmail(request, userEmail);
        return Ok(insights);
    }

    [HttpGet("health")]
    public ActionResult<object> Health()
    {
        return Ok(new { status = "healthy", service = "AxisML" });
    }
}
