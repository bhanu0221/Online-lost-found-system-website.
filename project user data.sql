-- this is lost and found database
CREATE DATABASE lost_and_found;
USE lost_and_found;

-- this is lost items database
CREATE TABLE lost_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(128),
    item_name VARCHAR(255) NOT NULL,
    category ENUM('Electronics', 'Documents', 'Jewelry', 'Clothing', 'Bags & Wallets', 'Keys', 'Others') NOT NULL,
    lost_date DATE NOT NULL,
    lost_location VARCHAR(255) NOT NULL,
    item_description TEXT NOT NULL,
    image_path VARCHAR(255) DEFAULT NULL,
    
    -- Contact details section
    contact_name VARCHAR(100) NOT NULL,
    contact_email VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    
    -- Location coordinates
    latitude DECIMAL(10, 7) DEFAULT NULL,
    longitude DECIMAL(10, 7) DEFAULT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);




SHOW TABLES;
SELECT * FROM lost_items;

DELETE FROM lost_items WHERE id = 4;
drop table lost_items; 


-- this is found items database 
CREATE TABLE found_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(128),
  item_name VARCHAR(100)NOT NULL,
  category VARCHAR(50),
  date_found DATE,
  location_name TEXT,
  latitude DECIMAL(10, 6),
  longitude DECIMAL(10, 6),
  description TEXT,
  image_path VARCHAR(255),
  finder_name VARCHAR(100),
  phone VARCHAR(20),
  alt_phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


SELECT * FROM found_items;


DELETE FROM found_items WHERE id = 2;
drop table found_items;


