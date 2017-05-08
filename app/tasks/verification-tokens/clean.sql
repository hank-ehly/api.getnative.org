DELETE FROM verification_tokens
WHERE expiration_date <= NOW();