create database products;
create table products.product (
    product_sku varchar(50),
    product_name varchar(200),
    launch_date date,
    created_time timestamp default current_timestamp
);