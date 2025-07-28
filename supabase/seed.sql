-- Seed initial item catalog with common discretionary items

INSERT INTO public.items (name, category, default_price_usd, price_source, refresh_freq_days) VALUES
-- Daily items
('Latte (12 oz)', 'coffee', 5.25, 'BLS-AP', 30),
('Energy Drink', 'food', 2.99, 'Manual', 30),
('Bottled Water (16 oz)', 'food', 1.50, 'BLS-AP', 30),
('Breakfast Sandwich', 'food', 4.50, 'Manual', 30),
('Candy Bar', 'food', 1.75, 'BLS-AP', 30),
('Coffee (Medium)', 'coffee', 2.50, 'BLS-AP', 30),
('Soft Drink (20 oz)', 'food', 2.25, 'Manual', 30),

-- Weekly items  
('Fast Food Combo Meal', 'food', 9.50, 'Manual', 30),
('Movie Ticket', 'entertainment', 12.00, 'Manual', 90),
('Six-pack Beer', 'food', 8.99, 'BLS-AP', 30),
('Takeout Pizza (Large)', 'food', 18.00, 'Manual', 30),
('Rideshare Trip (Average)', 'transportation', 15.00, 'Manual', 30),
('Lunch Out', 'food', 13.00, 'Manual', 30),

-- Monthly subscriptions
('Netflix Subscription', 'subscription', 15.49, 'Manual', 90),
('Spotify Premium', 'subscription', 10.99, 'Manual', 90),
('Gym Membership', 'subscription', 35.00, 'Manual', 90),
('Cloud Storage (100GB)', 'subscription', 1.99, 'Manual', 90),
('Streaming Service (Hulu)', 'subscription', 7.99, 'Manual', 90),
('Beauty Box Subscription', 'subscription', 25.00, 'Manual', 90),
('Gaming Subscription', 'subscription', 14.99, 'Manual', 90),

-- Household items
('Premium Toilet Paper (12-pack)', 'household', 15.99, 'Manual', 30),
('Cleaning Supplies', 'household', 8.50, 'Manual', 30),
('Scented Candle', 'household', 12.99, 'Manual', 90),

-- Clothing/Personal
('Basic T-Shirt', 'clothing', 19.99, 'Manual', 90),
('Skincare Product', 'clothing', 28.00, 'Manual', 90),

-- Entertainment/Misc
('Books/Magazines', 'entertainment', 15.00, 'Manual', 90),
('Mobile Game Purchase', 'entertainment', 4.99, 'Manual', 90);

-- Add some example user (this would typically be handled by your auth system)
-- INSERT INTO public.users (id, email) VALUES 
-- ('550e8400-e29b-41d4-a716-446655440000', 'example@test.com');