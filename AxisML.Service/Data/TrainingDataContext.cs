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
                UserEmail TEXT NOT NULL,
                Subject TEXT,
                Body TEXT,
                FromAddress TEXT,
                ReceivedDateTime TEXT,
                Priority REAL,
                Category TEXT,
                Sentiment TEXT,
                ExtractedAt TEXT
            )";
        command.ExecuteNonQuery();

        // Create index on UserEmail for faster queries
        command.CommandText = "CREATE INDEX IF NOT EXISTS idx_user_email ON EmailTrainingData(UserEmail)";
        command.ExecuteNonQuery();

        // Add columns if they don't exist (for existing databases)
        try
        {
            command.CommandText = "ALTER TABLE EmailTrainingData ADD COLUMN Priority REAL";
            command.ExecuteNonQuery();
        }
        catch { }
        
        try
        {
            command.CommandText = "ALTER TABLE EmailTrainingData ADD COLUMN Category TEXT";
            command.ExecuteNonQuery();
        }
        catch { }
        
        try
        {
            command.CommandText = "ALTER TABLE EmailTrainingData ADD COLUMN Sentiment TEXT";
            command.ExecuteNonQuery();
        }
        catch { }
    }

    public void SaveEmail(string userEmail, string id, string subject, string body, string from, DateTime received, float? priority = null, string? category = null, string? sentiment = null)
    {
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();

        var command = connection.CreateCommand();
        command.CommandText = @"
            INSERT OR REPLACE INTO EmailTrainingData 
            (Id, UserEmail, Subject, Body, FromAddress, ReceivedDateTime, Priority, Category, Sentiment, ExtractedAt)
            VALUES ($id, $userEmail, $subject, $body, $from, $received, $priority, $category, $sentiment, $extracted)";
        
        command.Parameters.AddWithValue("$id", id);
        command.Parameters.AddWithValue("$userEmail", userEmail);
        command.Parameters.AddWithValue("$subject", subject ?? "");
        command.Parameters.AddWithValue("$body", body ?? "");
        command.Parameters.AddWithValue("$from", from ?? "");
        command.Parameters.AddWithValue("$received", received.ToString("o"));
        command.Parameters.AddWithValue("$priority", priority.HasValue ? (object)priority.Value : DBNull.Value);
        command.Parameters.AddWithValue("$category", category ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("$sentiment", sentiment ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("$extracted", DateTime.UtcNow.ToString("o"));
        
        command.ExecuteNonQuery();
    }

    public List<(string Subject, string Body, string From, float? Priority, string? Category, string? Sentiment)> GetAllEmailsWithLabels(string userEmail)
    {
        var emails = new List<(string, string, string, float?, string?, string?)>();
        
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();

        var command = connection.CreateCommand();
        command.CommandText = "SELECT Subject, Body, FromAddress, Priority, Category, Sentiment FROM EmailTrainingData WHERE UserEmail = $userEmail";
        command.Parameters.AddWithValue("$userEmail", userEmail);
        
        using var reader = command.ExecuteReader();
        while (reader.Read())
        {
            emails.Add((
                reader.GetString(0),
                reader.GetString(1),
                reader.GetString(2),
                reader.IsDBNull(3) ? null : (float?)reader.GetDouble(3),
                reader.IsDBNull(4) ? null : reader.GetString(4),
                reader.IsDBNull(5) ? null : reader.GetString(5)
            ));
        }

        return emails;
    }

    public List<(string Subject, string Body, string From)> GetAllEmails(string userEmail)
    {
        var emails = new List<(string, string, string)>();
        
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();

        var command = connection.CreateCommand();
        command.CommandText = "SELECT Subject, Body, FromAddress FROM EmailTrainingData WHERE UserEmail = $userEmail";
        command.Parameters.AddWithValue("$userEmail", userEmail);
        
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

    public int GetEmailCount(string userEmail)
    {
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();

        var command = connection.CreateCommand();
        command.CommandText = "SELECT COUNT(*) FROM EmailTrainingData WHERE UserEmail = $userEmail";
        command.Parameters.AddWithValue("$userEmail", userEmail);
        
        return Convert.ToInt32(command.ExecuteScalar());
    }
}
