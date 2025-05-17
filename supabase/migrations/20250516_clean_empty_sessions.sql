-- Create the function to clean empty sessions
CREATE OR REPLACE FUNCTION clean_empty_sessions()
RETURNS void AS $$
BEGIN
    -- Delete sessions where spots_available equals capacity (empty sessions)
    DELETE FROM sessions
    WHERE spots_available = capacity;
END;
$$ LANGUAGE plpgsql;

-- Create a cron job that runs this function every hour
SELECT cron.schedule('clean_empty_sessions', '0 * * * *', 'SELECT clean_empty_sessions()');
