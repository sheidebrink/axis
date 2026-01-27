using AxisML.Service.Services;
using AxisML.Service.Data;
using AxisML.Service.Jobs;
using Hangfire;
using Hangfire.Storage.SQLite;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSingleton<EmailPredictionService>();
builder.Services.AddSingleton<TrainingDataContext>();
builder.Services.AddSingleton<EmailExtractionService>();
builder.Services.AddSingleton<ModelTrainingService>();
builder.Services.AddTransient<MLTrainingJobs>();

// Hangfire configuration with SQLite
builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSQLiteStorage("hangfire.db"));

builder.Services.AddHangfireServer();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseHangfireDashboard("/hangfire");
app.MapControllers();

// Schedule recurring jobs
MLTrainingJobs.ScheduleJobs();

app.Run("http://localhost:5000");
