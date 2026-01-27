using Microsoft.AspNetCore.Mvc;
using Hangfire;
using AxisML.Service.Jobs;
using AxisML.Service.Services;
using AxisML.Service.Data;

namespace AxisML.Service.API;

[ApiController]
[Route("api/[controller]")]
public class JobsController : ControllerBase
{
    private readonly TrainingDataContext _dataContext;
    private readonly ModelTrainingService _trainingService;
    private readonly IConfiguration _configuration;

    public JobsController(TrainingDataContext dataContext, ModelTrainingService trainingService, IConfiguration configuration)
    {
        _dataContext = dataContext;
        _trainingService = trainingService;
        _configuration = configuration;
    }

    [HttpPost("trigger")]
    public IActionResult TriggerTraining()
    {
        var jobId = BackgroundJob.Enqueue<MLTrainingJobs>(job => job.ExtractAndTrainAsync());
        return Ok(new { jobId, message = "Training job queued" });
    }

    [HttpGet("status")]
    public IActionResult GetStatus()
    {
        var userEmail = _configuration["O365:UserEmail"] ?? "unknown";
        var emailCount = _dataContext.GetEmailCount(userEmail);
        var modelVersion = _trainingService.GetLatestModelVersion(userEmail);

        return Ok(new
        {
            userEmail,
            trainingDataCount = emailCount,
            latestModelVersion = modelVersion,
            nextScheduledRun = "Daily at 2:00 AM UTC"
        });
    }
}
