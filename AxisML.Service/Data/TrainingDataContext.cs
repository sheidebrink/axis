using Microsoft.Data.Sqlite;

namespace AxisML.Service.Data;

public class TrainingDataContext
{
    private readonly string _connectionString;

    public TrainingDataContext(string dbPath = "training_data.db")
    {
        _connectionString = $"Data Source={dbPath}";
        InitializeDatabase();
    }

    private void InitializeDatabase()
    {
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();

        var command = connection.CreateCommand();
        command.CommandText = @"
            CREATE TABLE IF NOT EXISTS EmailTrainingData (
                Id TEXT PRIMARY KEY,
                Subject TEXT,
                Body TEXT,
                FromAddress TEXT,
                ReceivedDateTime TEXT,
                Priority INTEGER,
                Category TEXT,
                Sentiment TEXT,
                ExtractedAt TEXT
            )";
        command.ExecuteNonQuery();
    }

    public void SaveEmail(string id, string subject, string body, string from, DateTime received)
    {
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();

        var command = connection.CreateCommand();
        command.CommandText = @"
            INSERT OR REPLACE INTO EmailTrainingData 
            (Id, Subject, Body, FromAddress, ReceivedDateTime, ExtractedAt)
            VALUES ($id, $subject, $body, $from, $received, $extracted)";
        
        command.Parameters.AddWithValue("$id", id);
        command.Parameters.AddWithValue("$subject", subject ?? "");
        command.Parameters.AddWithValue("$body", body ?? "");
        command.Parameters.AddWithValue("$from", from ?? "");
        command.Parameters.AddWithValue("$received", received.ToString("o"));
        command.Parameters.AddWithValue("$extracted", DateTime.UtcNow.ToString("o"));
        
        command.ExecuteNonQuery();
    }

    public List<(string Subject, string Body, string From)> GetAllEmails()
    {
        var emails = new List<(string, string, string)>();
        
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();

        var command = connection.CreateCommand();
        command.CommandText = "SELECT Subject, Body, FromAddress FROM EmailTrainingData";
        
        using var reader = command.ExecuteReader();
        while (reader.Read())
        {
            emails.Add((
                reader.GetString(0),
                reader.GetString(1),
                reader.GetString(2)
            ));
        }

        return emails;
    }

    public int GetEmailCount()
    {
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();

        var command = connection.CreateCommand();
        command.CommandText = "SELECT COUNT(*) FROM EmailTrainingData";
        
        return Convert.ToInt32(command.ExecuteScalar());
    }
}
