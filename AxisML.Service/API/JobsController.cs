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

    public JobsController(TrainingDataContext dataContext, ModelTrainingService trainingService)
    {
        _dataContext = dataContext;
        _trainingService = trainingService;
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
        var emailCount = _dataContext.GetEmailCount();
        var modelVersion = _trainingService.GetLatestModelVersion();

        return Ok(new
        {
            trainingDataCount = emailCount,
            latestModelVersion = modelVersion,
            nextScheduledRun = "Daily at 2:00 AM UTC"
        });
    }
}
