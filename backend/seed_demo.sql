CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    city VARCHAR NOT NULL,
    signup_date DATE NOT NULL,
    payment_token VARCHAR NOT NULL
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    category VARCHAR NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    stock INTEGER NOT NULL
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    order_date DATE NOT NULL,
    status VARCHAR NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL
);

INSERT INTO customers (name, email, city, signup_date, payment_token) VALUES
('Aarav Sharma', 'aarav@example.com', 'Mumbai', '2025-01-15', 'tok_4f9a1c'),
('Priya Nair', 'priya@example.com', 'Bangalore', '2025-02-20', 'tok_8b2e7d'),
('Rohan Gupta', 'rohan@example.com', 'Delhi', '2025-03-05', 'tok_1c5f9a'),
('Sneha Iyer', 'sneha@example.com', 'Mumbai', '2025-04-11', 'tok_9d3a2b'),
('Karan Mehta', 'karan@example.com', 'Pune', '2025-05-30', 'tok_7e1f4c');

INSERT INTO products (name, category, price, stock) VALUES
('Wireless Mouse', 'Electronics', 799.00, 150),
('Mechanical Keyboard', 'Electronics', 3499.00, 40),
('Yoga Mat', 'Fitness', 999.00, 0),
('Running Shoes', 'Fitness', 4999.00, 25),
('Coffee Mug', 'Home', 299.00, 300),
('Desk Lamp', 'Home', 1299.00, 60);

INSERT INTO orders (customer_id, order_date, status, total_amount) VALUES
(1, '2026-08-01', 'completed', 4298.00),
(2, '2026-08-15', 'completed', 999.00),
(3, '2026-09-02', 'completed', 3499.00),
(1, '2026-09-10', 'pending', 799.00),
(4, '2026-09-18', 'completed', 5998.00),
(5, '2026-09-20', 'cancelled', 1299.00);

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
(1, 2, 1, 3499.00), (1, 1, 1, 799.00),
(2, 3, 1, 999.00),
(3, 2, 1, 3499.00),
(4, 1, 1, 799.00),
(5, 4, 1, 4999.00), (5, 1, 1, 799.00), (5, 5, 1, 299.00),
(6, 6, 1, 1299.00);