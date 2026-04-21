--
-- PostgreSQL database dump
--

\restrict yluGhldGqhsJz1EMK9FUNg36qOo1fMnahmBBLfngx1RYngdhPwcotzEYc0k55MT

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: inventoryaction; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.inventoryaction AS ENUM (
    'STOCK_IN',
    'STOCK_OUT',
    'ADJUSTMENT',
    'DAMAGE',
    'RETURN',
    'SALE'
);


--
-- Name: orderstatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.orderstatus AS ENUM (
    'PENDING',
    'COMPLETED',
    'CANCELLED',
    'REFUNDED',
    'ON_HOLD'
);


--
-- Name: paymentmethod; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.paymentmethod AS ENUM (
    'CASH',
    'CREDIT_CARD',
    'DEBIT_CARD',
    'MOBILE_PAYMENT',
    'BANK_TRANSFER',
    'CHEQUE',
    'OTHER'
);


--
-- Name: paymentstatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.paymentstatus AS ENUM (
    'PENDING',
    'COMPLETED',
    'FAILED',
    'REFUNDED',
    'PARTIALLY_REFUNDED'
);


--
-- Name: userrole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.userrole AS ENUM (
    'ADMIN',
    'CASHIER',
    'MANAGER',
    'INVENTORY_OFFICER'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_active boolean NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    icon_name character varying(50) DEFAULT 'Coffee'::character varying,
    tax_rate integer DEFAULT 5,
    printer_ip character varying(50),
    printer_port integer
);


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id integer NOT NULL,
    owner_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    mobile character varying(50) NOT NULL,
    hotel_name character varying(255),
    selected_modules json,
    discount character varying(100),
    status character varying(50),
    created_at timestamp without time zone,
    hotel_door_no character varying(100),
    hotel_street character varying(255),
    hotel_area character varying(255),
    hotel_city character varying(100),
    hotel_district character varying(100),
    hotel_state character varying(100),
    hotel_pincode character varying(20),
    owner_door_no character varying(100),
    owner_street character varying(255),
    owner_area character varying(255),
    owner_city character varying(100),
    owner_district character varying(100),
    owner_state character varying(100),
    owner_pincode character varying(20),
    gst_number character varying(50),
    pan_number character varying(50),
    hotel_license_number character varying(100),
    extra_license character varying(100),
    aadhar_number character varying(50),
    selected_plan character varying(100),
    is_deleted integer DEFAULT 0
);


--
-- Name: clients_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.clients_id_seq OWNED BY public.clients.id;


--
-- Name: coupon_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupon_categories (
    id integer NOT NULL,
    coupon_id integer NOT NULL,
    category_id integer NOT NULL
);


--
-- Name: coupon_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.coupon_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: coupon_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.coupon_categories_id_seq OWNED BY public.coupon_categories.id;


--
-- Name: coupons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupons (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    discount_type character varying(20) NOT NULL,
    discount_value double precision NOT NULL,
    min_order_amount double precision,
    max_uses integer,
    used_count integer,
    valid_from timestamp with time zone DEFAULT now(),
    valid_until timestamp with time zone,
    is_active boolean,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    product_id integer,
    is_first_order_only boolean DEFAULT false NOT NULL
);


--
-- Name: coupons_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.coupons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: coupons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.coupons_id_seq OWNED BY public.coupons.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    email character varying(100),
    phone character varying(20),
    address character varying(255),
    city character varying(100),
    state character varying(100),
    zip_code character varying(20),
    country character varying(100),
    loyalty_points integer NOT NULL,
    total_spent numeric(10,2) NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: dish_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dish_templates (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    image_url character varying(500) NOT NULL,
    description text,
    default_category_id integer
);


--
-- Name: dish_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dish_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: dish_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dish_templates_id_seq OWNED BY public.dish_templates.id;


--
-- Name: email_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_templates (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    subject character varying(255) NOT NULL,
    body text NOT NULL
);


--
-- Name: email_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.email_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: email_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.email_templates_id_seq OWNED BY public.email_templates.id;


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expenses (
    id integer NOT NULL,
    title character varying NOT NULL,
    category character varying NOT NULL,
    amount double precision NOT NULL,
    date character varying NOT NULL,
    subtitle character varying,
    type character varying,
    account character varying,
    tax double precision,
    payment_mode character varying,
    notes character varying,
    created_at timestamp with time zone DEFAULT now(),
    due_date character varying
);


--
-- Name: expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.expenses_id_seq OWNED BY public.expenses.id;


--
-- Name: inventory_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_logs (
    id integer NOT NULL,
    product_id integer NOT NULL,
    user_id integer,
    action public.inventoryaction NOT NULL,
    quantity_change integer NOT NULL,
    quantity_before integer NOT NULL,
    quantity_after integer NOT NULL,
    reference_number character varying(100),
    notes text,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: inventory_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_logs_id_seq OWNED BY public.inventory_logs.id;


--
-- Name: landing_pricing_features; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.landing_pricing_features (
    id integer NOT NULL,
    text character varying(255) NOT NULL,
    is_highlight boolean
);


--
-- Name: landing_pricing_features_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.landing_pricing_features_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: landing_pricing_features_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.landing_pricing_features_id_seq OWNED BY public.landing_pricing_features.id;


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(50) NOT NULL,
    hotel_name character varying(255),
    license_number character varying(100),
    city character varying(100),
    branches integer,
    message text,
    status character varying(50),
    created_at timestamp without time zone,
    selected_plan character varying(100)
);


--
-- Name: leads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.leads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: leads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.leads_id_seq OWNED BY public.leads.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description character varying,
    category character varying(50),
    is_read boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: order_coupons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_coupons (
    id integer NOT NULL,
    order_id integer NOT NULL,
    coupon_id integer NOT NULL
);


--
-- Name: order_coupons_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_coupons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: order_coupons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_coupons_id_seq OWNED BY public.order_coupons.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer NOT NULL,
    product_id integer,
    product_name character varying(200) NOT NULL,
    product_sku character varying(50) NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    discount numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    order_number character varying(50) NOT NULL,
    customer_id integer,
    user_id integer NOT NULL,
    status public.orderstatus NOT NULL,
    payment_method character varying(50),
    subtotal numeric(10,2) NOT NULL,
    tax numeric(10,2) NOT NULL,
    discount numeric(10,2) NOT NULL,
    total numeric(10,2) NOT NULL,
    notes text,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    completed_at timestamp without time zone
);


--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    order_id integer NOT NULL,
    payment_method public.paymentmethod NOT NULL,
    status public.paymentstatus NOT NULL,
    amount numeric(10,2) NOT NULL,
    transaction_id character varying(100),
    reference_number character varying(100),
    notes text,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: pricing_bundles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pricing_bundles (
    id integer NOT NULL,
    name character varying(255),
    modules json NOT NULL,
    total_price double precision,
    discount double precision,
    final_price double precision
);


--
-- Name: pricing_bundles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pricing_bundles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pricing_bundles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pricing_bundles_id_seq OWNED BY public.pricing_bundles.id;


--
-- Name: pricing_modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pricing_modules (
    id integer NOT NULL,
    name character varying(255),
    price double precision,
    is_base boolean
);


--
-- Name: pricing_modules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pricing_modules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pricing_modules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pricing_modules_id_seq OWNED BY public.pricing_modules.id;


--
-- Name: print_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.print_jobs (
    id integer NOT NULL,
    order_id integer NOT NULL,
    printer_ip character varying(50) NOT NULL,
    printer_port integer,
    content text NOT NULL,
    created_at timestamp without time zone NOT NULL,
    printed_at timestamp without time zone,
    status character varying(20) NOT NULL
);


--
-- Name: print_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.print_jobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: print_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.print_jobs_id_seq OWNED BY public.print_jobs.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id integer NOT NULL,
    sku character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    barcode character varying(100),
    price numeric(10,2) NOT NULL,
    cost_price numeric(10,2),
    stock_quantity integer NOT NULL,
    min_stock_level integer NOT NULL,
    is_active boolean NOT NULL,
    image_url character varying(500),
    category_id integer,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: staff; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff (
    id integer NOT NULL,
    name character varying NOT NULL,
    phone character varying NOT NULL,
    role character varying NOT NULL,
    salary double precision NOT NULL,
    joined date NOT NULL,
    aadhar character varying,
    is_active boolean NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: staff_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.staff_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: staff_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.staff_id_seq OWNED BY public.staff.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    full_name character varying(100) NOT NULL,
    phone_number character varying(20),
    role public.userrole NOT NULL,
    is_active boolean NOT NULL,
    is_verified boolean NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    last_login timestamp without time zone
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: clients id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients ALTER COLUMN id SET DEFAULT nextval('public.clients_id_seq'::regclass);


--
-- Name: coupon_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_categories ALTER COLUMN id SET DEFAULT nextval('public.coupon_categories_id_seq'::regclass);


--
-- Name: coupons id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons ALTER COLUMN id SET DEFAULT nextval('public.coupons_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: dish_templates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dish_templates ALTER COLUMN id SET DEFAULT nextval('public.dish_templates_id_seq'::regclass);


--
-- Name: email_templates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates ALTER COLUMN id SET DEFAULT nextval('public.email_templates_id_seq'::regclass);


--
-- Name: expenses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses ALTER COLUMN id SET DEFAULT nextval('public.expenses_id_seq'::regclass);


--
-- Name: inventory_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_logs ALTER COLUMN id SET DEFAULT nextval('public.inventory_logs_id_seq'::regclass);


--
-- Name: landing_pricing_features id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.landing_pricing_features ALTER COLUMN id SET DEFAULT nextval('public.landing_pricing_features_id_seq'::regclass);


--
-- Name: leads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads ALTER COLUMN id SET DEFAULT nextval('public.leads_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: order_coupons id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_coupons ALTER COLUMN id SET DEFAULT nextval('public.order_coupons_id_seq'::regclass);


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: pricing_bundles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pricing_bundles ALTER COLUMN id SET DEFAULT nextval('public.pricing_bundles_id_seq'::regclass);


--
-- Name: pricing_modules id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pricing_modules ALTER COLUMN id SET DEFAULT nextval('public.pricing_modules_id_seq'::regclass);


--
-- Name: print_jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.print_jobs ALTER COLUMN id SET DEFAULT nextval('public.print_jobs_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: staff id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff ALTER COLUMN id SET DEFAULT nextval('public.staff_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.alembic_version VALUES ('e0726c3b82ac');


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.categories VALUES (3, 'VEG', 'full veg', true, '2026-02-26 15:13:26.325116', '2026-03-06 00:54:26.780144', 'IceCream', 5, NULL, NULL);
INSERT INTO public.categories VALUES (2, 'Beverages', NULL, true, '2026-02-09 06:44:29.020698', '2026-03-09 09:49:48.856633', 'Utensils', 5, NULL, NULL);
INSERT INTO public.categories VALUES (1, 'Non - Veg', 'Spicy', true, '2026-02-09 06:27:58.708796', '2026-03-10 14:55:34.963367', 'Coffee', 5, NULL, NULL);


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.clients VALUES (1, 'kiruba', 'kavithasuec@gmail.com', '9876543221', 'k', '["POS", "Offers", "Reports", "KOT", "Dashboard", "Menu"]', '10%', 'active', '2026-03-29 07:21:19.050207', '1', 'kpm', 'spa', 'Kanchipuram', 'Kanchipuram', 'Tamil Nadu', '123321', '2', 'k', 'kp', 'kpm', 'Kanchipuram', 'Tamil Nadu', '321123', '22AAAAA0000A1Z5', 'ABCDE1234F', '132', NULL, NULL, NULL, 0);
INSERT INTO public.clients VALUES (2, 'kiruba', 'kavithasuec@gmail.com', '9876543221', 'k', '["POS", "Offers", "Reports", "KOT", "Dashboard", "Menu"]', '10%', 'active', '2026-03-29 07:21:24.406367', '1', 'kpm', 'spa', 'Kanchipuram', 'Kanchipuram', 'Tamil Nadu', '123321', '2', 'k', 'kp', 'kpm', 'Kanchipuram', 'Tamil Nadu', '321123', '22AAAAA0000A1Z5', 'ABCDE1234F', '132', NULL, NULL, NULL, 0);
INSERT INTO public.clients VALUES (3, 'kiruba', 'kavithasuec@gmail.com', '9876543221', 'k', '["POS", "Offers", "Reports", "KOT", "Dashboard", "Menu"]', '10%', 'active', '2026-03-29 07:21:25.017386', '1', 'kpm', 'spa', 'Kanchipuram', 'Kanchipuram', 'Tamil Nadu', '123321', '2', 'k', 'kp', 'kpm', 'Kanchipuram', 'Tamil Nadu', '321123', '22AAAAA0000A1Z5', 'ABCDE1234F', '132', NULL, NULL, NULL, 0);
INSERT INTO public.clients VALUES (4, 'gopi', 'kavisri399@gmail.com', '8072620321', 'moms kitchen', '["POS"]', '10', 'active', '2026-03-31 16:36:58.389516', '10', 'kpm', 'kanchipuram', 'kanchipuram', 'kpm', '', '123321', '', '', '', '', '', '', '', '22AAA5421', '', '1234', NULL, NULL, NULL, 0);
INSERT INTO public.clients VALUES (5, 'k', 'sakrajesh2007@gmail.com', '9876543219', 'g', '["KOT"]', '5', 'mail_sent', '2026-04-01 14:53:52.084185', '', '', '', 'kpm', '', '', '', '', '', '', '', '', '', '', '', '', '', NULL, NULL, NULL, 0);
INSERT INTO public.clients VALUES (6, 'k', 'a40145822@gmail.com', '7655674531', 'annakkili', '["POS"]', '10', 'active', '2026-04-01 16:48:53.766357', '', '', '', 'kpm', '', '', '', '', '', '', '', '', '', '', '22BBCC1244', '', '456712', NULL, NULL, NULL, 0);
INSERT INTO public.clients VALUES (7, 'sri', 'kaviannu40@gmail.com', '8220563421', 'kavisri', '["POS", "Offers"]', '', 'onboarding_completed', '2026-04-02 07:01:23.494957', '', '', '', 'CHENNAI', '', '', '', '', '', '', '', '', '', '', '2AWSSS', '', '32456', NULL, NULL, NULL, 0);
INSERT INTO public.clients VALUES (9, 'kavithasrig', 'srikavi807204@gmail.com', '9012432165', 'rose', '["POS", "Dashboard", "Menu", "Customer"]', '50.0', 'onboarding_completed', '2026-04-03 03:05:14.763851', '', '', '', 'banglore', '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '33AASSQWE32', '', '98', NULL, NULL, 'menu-dashboard', 0);
INSERT INTO public.clients VALUES (8, 'ggg', 'kavithaannakkili@gmail.com', '9629009412', 'mmm', '["POS", "Menu", "Offer", "Customer"]', '20.0', 'onboarding_completed', '2026-04-02 18:44:28.156502', '', '', '', 'kanchipuram', '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2ASWSSAA1', '', '1', NULL, NULL, 'pos-menu', 0);


--
-- Data for Name: coupon_categories; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.coupons VALUES (1, 'VALENTINE', 'percentage', 10, 299, 99, 0, '2026-02-01 00:00:00+00', '2026-02-28 00:00:00+00', true, NULL, '2026-02-09 06:47:32.553647+00', NULL, NULL, false);
INSERT INTO public.coupons VALUES (2, 'MAR', 'percentage', 10, 299, 100, 0, '2026-03-01 00:00:00+00', '2026-03-31 00:00:00+00', true, NULL, '2026-03-02 02:48:56.783896+00', NULL, NULL, false);
INSERT INTO public.coupons VALUES (5, 'DIW', 'percentage', 10, 300, 99, 0, '2026-03-01 00:00:00+00', '2026-03-31 00:00:00+00', true, NULL, '2026-03-02 02:49:50.016417+00', NULL, NULL, false);
INSERT INTO public.coupons VALUES (7, 'WELCOME10', 'percentage', 10, 200, NULL, 0, '2026-03-10 14:26:24.162888+00', NULL, true, 'Welcome offer for first-time customers', '2026-03-10 14:26:24.162888+00', '2026-03-10 15:18:27.844827+00', NULL, true);


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.customers VALUES (1, 'Mohan', 'Sundar', 'mohan@example.com', '9087654341', 'kovil st', 'chennai', 'string', '123', 'India', 1099, 1099.00, true, '2026-02-09 06:34:44.840924', '2026-03-08 11:17:07.654308');
INSERT INTO public.customers VALUES (2, 'kiruba', 'Sudhakar', 'kiruba@example.com', '9012355645', 'malaya street', 'chennai', 'string', '1234', 'India', 2176, 2176.00, true, '2026-02-09 06:40:00.234566', '2026-03-09 01:11:50.937913');
INSERT INTO public.customers VALUES (3, 'Kavi', 'Sri', 'kavisri399@gmail.com', '8220562494', 'small st', 'kpm', 'TamilNadu', '123456', 'India', 0, 0.00, true, '2026-03-12 04:41:20.156776', '2026-03-12 04:41:20.156793');


--
-- Data for Name: dish_templates; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: email_templates; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.email_templates VALUES (1, 'client_onboarding', 'Welcome to Vayu POS - Complete Your Onboarding', '
            <html>
                <body style="font-family: sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2 style="color: #0d9488;">Dear {{owner_name}},</h2>
                        <p>Thank you for showing interest in <strong>Vayu POS</strong>. We are excited to have you on board!</p>
                        <p>To get started and activate your account, please complete your onboarding details using the secure link below:</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{{onboarding_link}}" 
                               style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                               Complete Onboarding Form
                            </a>
                        </div>

                        <p><strong>Hotel:</strong> {{hotel_name}}</p>
                        <p>If the button doesn''t work, copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #666;">{{onboarding_link}}</p>
                        
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                        <p style="font-size: 12px; color: #999;">
                            Best regards,<br/><strong>Vayu POS Team</strong>
                        </p>
                    </div>
                </body>
            </html>
        ');
INSERT INTO public.email_templates VALUES (2, 'Onboarding', 'Welcome to Vayu POS - Ready for Your Demo?', '
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h1 style="color: #0d9488;">Hello {{owner_name}}!</h1>
                <p>Thank you for requesting a demo for <strong>{{hotel_name}}</strong>.</p>
                <p>We are excited to help you streamline your operations. Our team will contact you shortly to schedule a walkthrough of the system.</p>
                
                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Selected Configuration:</h3>
                    <ul style="list-style: none; padding-left: 0;">
                        <li><strong>Plan:</strong> {{plan}}</li>
                        <li><strong>Included Modules:</strong> {{modules}}</li>
                    </ul>
                </div>
                
                <p>If you have any urgent questions, feel free to reply to this email.</p>
                <p>Best Regards,<br><strong>The Vayu POS Team</strong></p>
            </div>
            ');


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.expenses VALUES (2, 'Salary: raveena', 'Salaries & Wages', 1000, '2026-02-09', 'Auto-added by Staff Payroll - Cashier', 'auto', 'Cashbook', 0, 'Cash', 'Monthly salary payment for raveena (Cashier) - Cycle: Mar 2026', '2026-02-09 10:13:05.61096+00', NULL);
INSERT INTO public.expenses VALUES (3, 'Salary: raveena', 'Salaries & Wages', 1000, '2026-02-18', 'Auto-added by Staff Payroll - Cashier', 'auto', 'Cashbook', 0, 'Cash', 'Monthly salary payment for raveena (Cashier) - Cycle: Mar 2026', '2026-02-18 16:36:45.469331+00', NULL);
INSERT INTO public.expenses VALUES (4, 'Veg Supplier', 'Kitchen Supplies', 2800, '2026-03-09', 'Manual entry', 'manual', 'Cashbook', 0, 'Cash', '', '2026-03-09 01:26:20.819495+00', NULL);
INSERT INTO public.expenses VALUES (1, 'water', 'kitchen', 1000, '2026-02-09 09:47', 'Manual entry', 'manual', 'Cashbook', 0, 'Cash', 'water supplies', '2026-02-09 09:47:44.651098+00', NULL);


--
-- Data for Name: inventory_logs; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.inventory_logs VALUES (1, 2, 1, 'STOCK_IN', 100, 0, 100, 'INIT-7UP', 'Opening stock', '2026-02-09 08:53:32.947411');
INSERT INTO public.inventory_logs VALUES (2, 2, 3, 'SALE', 1, 100, 99, 'ORD-20260209-667FB56E', 'Sold via order ORD-20260209-667FB56E', '2026-02-09 08:56:00.225104');
INSERT INTO public.inventory_logs VALUES (3, 5, 3, 'SALE', 1, 200, 199, 'ORD-20260209-E7A9830A', 'Sold via order ORD-20260209-E7A9830A', '2026-02-09 08:56:30.898982');
INSERT INTO public.inventory_logs VALUES (4, 3, 1, 'STOCK_IN', 50, 0, 50, 'INIT-7UP', 'Initial stock for 7UP', '2026-02-09 08:57:39.63119');
INSERT INTO public.inventory_logs VALUES (5, 3, 3, 'SALE', 1, 50, 49, 'ORD-20260209-F1637BB1', 'Sold via order ORD-20260209-F1637BB1', '2026-02-09 09:00:54.954565');
INSERT INTO public.inventory_logs VALUES (6, 3, 3, 'SALE', 1, 49, 48, 'ORD-20260209-2ADBFB70', 'Sold via order ORD-20260209-2ADBFB70', '2026-02-09 09:01:21.911711');
INSERT INTO public.inventory_logs VALUES (7, 4, 3, 'SALE', 1, 100, 99, 'ORD-20260226-D7BFEC11', 'Sold via order ORD-20260226-D7BFEC11', '2026-02-26 14:38:42.535883');
INSERT INTO public.inventory_logs VALUES (8, 3, 3, 'SALE', 1, 48, 47, 'ORD-20260226-CD4582E9', 'Sold via order ORD-20260226-CD4582E9', '2026-02-26 14:39:50.885003');
INSERT INTO public.inventory_logs VALUES (9, 12, 3, 'SALE', 1, 50, 49, 'ORD-20260226-CD4582E9', 'Sold via order ORD-20260226-CD4582E9', '2026-02-26 14:39:50.886005');
INSERT INTO public.inventory_logs VALUES (10, 20, 3, 'SALE', 1, 25, 24, 'ORD-20260226-E3606BBF', 'Sold via order ORD-20260226-E3606BBF', '2026-02-26 14:41:24.170556');
INSERT INTO public.inventory_logs VALUES (11, 3, 3, 'SALE', 1, 47, 46, 'ORD-20260226-66935C61', 'Sold via order ORD-20260226-66935C61', '2026-02-26 15:08:15.255807');
INSERT INTO public.inventory_logs VALUES (12, 21, 3, 'SALE', 1, 35, 34, 'ORD-20260226-66935C61', 'Sold via order ORD-20260226-66935C61', '2026-02-26 15:08:15.256773');
INSERT INTO public.inventory_logs VALUES (13, 20, 3, 'SALE', 1, 24, 23, 'ORD-20260226-66935C61', 'Sold via order ORD-20260226-66935C61', '2026-02-26 15:08:15.257723');
INSERT INTO public.inventory_logs VALUES (14, 4, 3, 'SALE', 1, 99, 98, 'ORD-20260226-66935C61', 'Sold via order ORD-20260226-66935C61', '2026-02-26 15:08:15.258637');
INSERT INTO public.inventory_logs VALUES (15, 23, 3, 'SALE', 1, 10, 9, 'ORD-20260226-66935C61', 'Sold via order ORD-20260226-66935C61', '2026-02-26 15:08:15.259485');
INSERT INTO public.inventory_logs VALUES (16, 14, 3, 'SALE', 1, 40, 39, 'ORD-20260226-66935C61', 'Sold via order ORD-20260226-66935C61', '2026-02-26 15:08:15.260474');
INSERT INTO public.inventory_logs VALUES (17, 17, 3, 'SALE', 1, 40, 39, 'ORD-20260301-E8054630', 'Sold via order ORD-20260301-E8054630', '2026-03-01 15:52:53.209193');
INSERT INTO public.inventory_logs VALUES (18, 23, 3, 'SALE', 1, 9, 8, 'ORD-20260306-01CD66B8', 'Sold via order ORD-20260306-01CD66B8', '2026-03-06 00:52:43.501751');
INSERT INTO public.inventory_logs VALUES (19, 13, 3, 'SALE', 2, 50, 48, 'ORD-20260306-CFAEA051', 'Sold via order ORD-20260306-CFAEA051', '2026-03-06 03:18:30.979186');
INSERT INTO public.inventory_logs VALUES (20, 2, 3, 'SALE', 2, 99, 97, 'ORD-20260306-CFAEA051', 'Sold via order ORD-20260306-CFAEA051', '2026-03-06 03:18:30.980174');
INSERT INTO public.inventory_logs VALUES (21, 9, 3, 'SALE', 2, 300, 298, 'ORD-20260306-CFAEA051', 'Sold via order ORD-20260306-CFAEA051', '2026-03-06 03:18:30.981107');
INSERT INTO public.inventory_logs VALUES (22, 7, 3, 'SALE', 2, 200, 198, 'ORD-20260306-CFAEA051', 'Sold via order ORD-20260306-CFAEA051', '2026-03-06 03:18:30.981939');
INSERT INTO public.inventory_logs VALUES (23, 15, 3, 'SALE', 1, 40, 39, 'ORD-20260306-73DED7A2', 'Sold via order ORD-20260306-73DED7A2', '2026-03-06 03:19:48.578723');
INSERT INTO public.inventory_logs VALUES (24, 13, 3, 'SALE', 1, 48, 47, 'ORD-20260306-73DED7A2', 'Sold via order ORD-20260306-73DED7A2', '2026-03-06 03:19:48.579671');
INSERT INTO public.inventory_logs VALUES (25, 9, 3, 'SALE', 1, 298, 297, 'ORD-20260306-73DED7A2', 'Sold via order ORD-20260306-73DED7A2', '2026-03-06 03:19:48.580589');
INSERT INTO public.inventory_logs VALUES (26, 9, 3, 'SALE', 1, 297, 296, 'ORD-20260308-792E90B5', 'Sold via order ORD-20260308-792E90B5', '2026-03-08 05:18:14.224462');
INSERT INTO public.inventory_logs VALUES (27, 22, 3, 'SALE', 1, 35, 34, 'ORD-20260308-966DA022', 'Sold via order ORD-20260308-966DA022', '2026-03-08 06:56:17.790689');
INSERT INTO public.inventory_logs VALUES (28, 23, 3, 'SALE', 1, 8, 7, 'ORD-20260308-D7F8C33D', 'Sold via order ORD-20260308-D7F8C33D', '2026-03-08 07:56:50.788575');
INSERT INTO public.inventory_logs VALUES (29, 20, 3, 'SALE', 1, 23, 22, 'ORD-20260308-AD3DB4E3', 'Sold via order ORD-20260308-AD3DB4E3', '2026-03-08 10:46:09.346916');
INSERT INTO public.inventory_logs VALUES (30, 22, 3, 'SALE', 10, 34, 24, 'ORD-20260308-1B1633B4', 'Sold via order ORD-20260308-1B1633B4', '2026-03-08 11:08:58.509774');
INSERT INTO public.inventory_logs VALUES (31, 12, 3, 'SALE', 1, 49, 48, 'ORD-20260308-47B86613', 'Sold via order ORD-20260308-47B86613', '2026-03-08 11:12:48.44189');
INSERT INTO public.inventory_logs VALUES (32, 16, 3, 'SALE', 1, 40, 39, 'ORD-20260308-47B86613', 'Sold via order ORD-20260308-47B86613', '2026-03-08 11:12:48.442719');
INSERT INTO public.inventory_logs VALUES (33, 4, 3, 'SALE', 1, 98, 97, 'ORD-20260308-47B86613', 'Sold via order ORD-20260308-47B86613', '2026-03-08 11:12:48.443533');
INSERT INTO public.inventory_logs VALUES (34, 20, 3, 'SALE', 1, 22, 21, 'ORD-20260308-15436FF0', 'Sold via order ORD-20260308-15436FF0', '2026-03-08 11:17:07.652647');
INSERT INTO public.inventory_logs VALUES (35, 7, 3, 'SALE', 1, 198, 197, 'ORD-20260309-641DAF66', 'Sold via order ORD-20260309-641DAF66', '2026-03-09 01:01:27.817524');
INSERT INTO public.inventory_logs VALUES (36, 17, 3, 'SALE', 1, 39, 38, 'ORD-20260309-ED5AFB89', 'Sold via order ORD-20260309-ED5AFB89', '2026-03-09 01:11:50.834275');


--
-- Data for Name: landing_pricing_features; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.leads VALUES (1, 'Test User', 'test@example.com', '1234567890', 'Test Hotel', 'ABC12345', 'Test City', 1, 'Testing AWS DB connection', 'New', '2026-03-28 16:50:13.257976', NULL);
INSERT INTO public.leads VALUES (2, 'gopi', 'kavisri399@gmail.com', '1234554321', 'kavisri', '123', 'chennai', 1, '', 'new', '2026-03-28 16:58:46.925578', NULL);
INSERT INTO public.leads VALUES (3, 'kiruba', 'xyz@gmail.com', '9876543221', 'k', '321', 'Kanchipuram', 2, '', 'new', '2026-03-29 06:47:03.027812', NULL);
INSERT INTO public.leads VALUES (4, 'sri', 'kaviannu40@gmail.com', '8220563421', 'anu', '4567', 'kanchipuram', 1, '', 'new', '2026-04-01 14:21:46.44648', NULL);
INSERT INTO public.leads VALUES (5, 'k', 'sakrajesh2007@gmail.com', '9876543219', 'g', '9876', 'kpm', 1, '', 'new', '2026-04-01 14:52:05.152618', NULL);
INSERT INTO public.leads VALUES (6, 'kavi', 'doowa447@gmail.com', '6744523123', 'ravee', '56', 'london', 1, '', 'new', '2026-04-01 16:44:51.466227', NULL);
INSERT INTO public.leads VALUES (7, 'k', 'a40145822@gmail.com', '7655674531', 'rajdiv', '45', 'malaysia', 3, '', 'new', '2026-04-01 16:48:30.730593', NULL);
INSERT INTO public.leads VALUES (8, 'kumar', 'ks8265934@gmail.com', '3454367812', 'arun', '34', 'kanchipuram', 1, '', 'new', '2026-04-02 18:15:22.336216', 'pos-menu');
INSERT INTO public.leads VALUES (9, 'gopi', 'ks8265934@gmail.com', '2343211234', 'arunkumar', '34', 'kanchipuram', 2, '', 'new', '2026-04-02 18:16:40.251632', 'pos-menu');
INSERT INTO public.leads VALUES (10, 'g', 'ks8265934@gmail.com', '6745341234', 'a', '56', 'kanchipuram', 1, '', 'new', '2026-04-02 18:29:16.101396', 'pos-menu');
INSERT INTO public.leads VALUES (11, 'g', 'kavithaannakkili@gmail.com', '2121212333', 'm', '1', 'kanchipuram', 1, '', 'verified', '2026-04-02 18:44:28.237614', 'pos-menu');
INSERT INTO public.leads VALUES (12, 'jagan', 'srikavi807204@gmail.com', '4512312956', 'rose', '98', 'banglore', 1, '', 'verified', '2026-04-03 03:05:14.86818', 'menu-dashboard');


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.notifications VALUES (1, 'New order #7', 'Order #ORD-20260209-667FB56E received - ₹200.0', 'order', true, '2026-02-09 08:56:01.366391+00');
INSERT INTO public.notifications VALUES (2, 'New order #8', 'Order #ORD-20260209-E7A9830A received - ₹11.0', 'order', true, '2026-02-09 08:56:32.090585+00');
INSERT INTO public.notifications VALUES (3, 'New order #9', 'Order #ORD-20260209-F1637BB1 received - ₹10.0', 'order', true, '2026-02-09 09:00:56.055478+00');
INSERT INTO public.notifications VALUES (4, 'New order #10', 'Order #ORD-20260209-2ADBFB70 received - ₹10.0', 'order', true, '2026-02-09 09:01:22.810411+00');
INSERT INTO public.notifications VALUES (5, 'New order #14', 'Order #ORD-20260226-D7BFEC11 received - ₹1.0', 'order', true, '2026-02-26 14:38:42.552262+00');
INSERT INTO public.notifications VALUES (6, 'New order #15', 'Order #ORD-20260226-CD4582E9 received - ₹130.0', 'order', true, '2026-02-26 14:39:50.897646+00');
INSERT INTO public.notifications VALUES (7, 'New order #16', 'Order #ORD-20260226-E3606BBF received - ₹99.0', 'order', true, '2026-02-26 14:41:24.178515+00');
INSERT INTO public.notifications VALUES (8, 'New order #17', 'Order #ORD-20260226-66935C61 received - ₹640.0', 'order', true, '2026-02-26 15:08:15.272372+00');
INSERT INTO public.notifications VALUES (9, 'New order #18', 'Order #ORD-20260301-E8054630 received - ₹250.0', 'order', true, '2026-03-01 15:52:52.962365+00');
INSERT INTO public.notifications VALUES (10, 'New order #19', 'Order #ORD-20260306-01CD66B8 received - ₹100.0', 'order', true, '2026-03-06 00:52:43.515979+00');
INSERT INTO public.notifications VALUES (11, 'New order #20', 'Order #ORD-20260306-CFAEA051 received - ₹213.14', 'order', true, '2026-03-06 03:18:30.993484+00');
INSERT INTO public.notifications VALUES (12, 'New order #21', 'Order #ORD-20260306-73DED7A2 received - ₹385.0', 'order', true, '2026-03-06 03:19:48.588265+00');
INSERT INTO public.notifications VALUES (13, 'New order #22', 'Order #ORD-20260308-792E90B5 received - ₹15.0', 'order', true, '2026-03-08 05:18:34.950485+00');
INSERT INTO public.notifications VALUES (14, 'New order #23', 'Order #ORD-20260308-966DA022 received - ₹180.0', 'order', true, '2026-03-08 06:56:17.802057+00');
INSERT INTO public.notifications VALUES (15, 'New order #24', 'Order #ORD-20260308-D7F8C33D received - ₹100.0', 'order', true, '2026-03-08 07:56:50.796025+00');
INSERT INTO public.notifications VALUES (16, 'New order #25', 'Order #ORD-20260308-AD3DB4E3 received - ₹99.0', 'order', true, '2026-03-08 10:46:09.365223+00');
INSERT INTO public.notifications VALUES (17, 'New order #26', 'Order #ORD-20260308-1B1633B4 received - ₹1800.0', 'order', true, '2026-03-08 11:08:58.53143+00');
INSERT INTO public.notifications VALUES (18, 'New order #27', 'Order #ORD-20260308-47B86613 received - ₹371.0', 'order', true, '2026-03-08 11:12:48.460828+00');
INSERT INTO public.notifications VALUES (19, 'New order #28', 'Order #ORD-20260308-15436FF0 received - ₹99.0', 'order', true, '2026-03-08 11:17:07.675238+00');
INSERT INTO public.notifications VALUES (20, 'New order #29', 'Order #ORD-20260309-641DAF66 received - ₹11.0', 'order', true, '2026-03-09 01:01:31.862569+00');
INSERT INTO public.notifications VALUES (21, 'New order #30', 'Order #ORD-20260309-ED5AFB89 received - ₹250.0', 'order', true, '2026-03-09 01:11:55.159208+00');
INSERT INTO public.notifications VALUES (22, 'Staff login', 'Staff newadmin logged in successfully', 'auth', true, '2026-03-09 04:47:36.03642+00');
INSERT INTO public.notifications VALUES (23, 'Staff login', 'Staff newadmin logged in successfully', 'auth', true, '2026-03-09 09:49:09.192823+00');
INSERT INTO public.notifications VALUES (24, 'Menu updated', 'Category updated: Beverages', 'category', true, '2026-03-09 09:49:49.42223+00');
INSERT INTO public.notifications VALUES (25, 'Staff login', 'Staff newadmin logged in successfully', 'auth', true, '2026-03-09 13:45:03.186574+00');
INSERT INTO public.notifications VALUES (26, 'Staff login', 'Staff newadmin logged in successfully', 'auth', true, '2026-03-09 14:16:01.28707+00');
INSERT INTO public.notifications VALUES (27, 'Staff login', 'Staff newadmin logged in successfully', 'auth', true, '2026-03-09 14:18:29.302189+00');
INSERT INTO public.notifications VALUES (28, 'Staff login', 'Staff newadmin logged in successfully', 'auth', true, '2026-03-09 14:20:18.446465+00');


--
-- Data for Name: order_coupons; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.order_items VALUES (1, 7, 2, 'Cheese Burger (Regular)', 'CHEESE-BURGER-REGULAR', 1, 200.00, 0.00, 200.00, '2026-02-09 08:56:00.451796');
INSERT INTO public.order_items VALUES (2, 8, 5, 'Mutton Biriyani', 's', 1, 11.00, 0.00, 11.00, '2026-02-09 08:56:31.097607');
INSERT INTO public.order_items VALUES (3, 9, 3, '7UP (Regular)', '7UP-REGULAR', 1, 10.00, 0.00, 10.00, '2026-02-09 09:00:55.115791');
INSERT INTO public.order_items VALUES (4, 10, 3, '7UP (Regular)', '7UP-REGULAR', 1, 10.00, 0.00, 10.00, '2026-02-09 09:01:22.013295');
INSERT INTO public.order_items VALUES (5, 14, 4, 'ChickenBurger', 'string', 1, 1.00, 0.00, 1.00, '2026-02-26 14:38:42.542146');
INSERT INTO public.order_items VALUES (6, 15, 3, '7UP (Regular)', '7UP-REGULAR', 1, 10.00, 0.00, 10.00, '2026-02-26 14:39:50.891529');
INSERT INTO public.order_items VALUES (7, 15, 12, 'Chicken Noodles', 'BURGER001', 1, 120.00, 0.00, 120.00, '2026-02-26 14:39:50.891534');
INSERT INTO public.order_items VALUES (8, 16, 20, 'French Fries', 'FRIES001', 1, 99.00, 0.00, 99.00, '2026-02-26 14:41:24.173021');
INSERT INTO public.order_items VALUES (9, 17, 3, '7UP (Regular)', '7UP-REGULAR', 1, 10.00, 0.00, 10.00, '2026-02-26 15:08:15.266073');
INSERT INTO public.order_items VALUES (10, 17, 21, 'White Sauce Pasta', 'PASTA1001', 1, 180.00, 0.00, 180.00, '2026-02-26 15:08:15.266078');
INSERT INTO public.order_items VALUES (11, 17, 20, 'French Fries', 'FRIES001', 1, 99.00, 0.00, 99.00, '2026-02-26 15:08:15.26608');
INSERT INTO public.order_items VALUES (12, 17, 4, 'ChickenBurger', 'string', 1, 1.00, 0.00, 1.00, '2026-02-26 15:08:15.266082');
INSERT INTO public.order_items VALUES (13, 17, 23, 'Test Product', 'FIXTEST001', 1, 100.00, 0.00, 100.00, '2026-02-26 15:08:15.266083');
INSERT INTO public.order_items VALUES (14, 17, 14, 'Chicken Pizza', 'PIZZA001', 1, 250.00, 0.00, 250.00, '2026-02-26 15:08:15.266085');
INSERT INTO public.order_items VALUES (15, 18, 17, 'Nuggets', 'ROLL003', 1, 250.00, 0.00, 250.00, '2026-03-01 15:52:53.426743');
INSERT INTO public.order_items VALUES (16, 19, 23, 'Test Product', 'FIXTEST001', 1, 100.00, 0.00, 100.00, '2026-03-06 00:52:43.51086');
INSERT INTO public.order_items VALUES (17, 20, 13, 'Chicken Noodles', 'BURG001', 2, 120.00, 0.00, 240.00, '2026-03-06 03:18:30.990271');
INSERT INTO public.order_items VALUES (18, 20, 2, 'Cheese Burger (Regular)', 'CHEESE-BURGER-REGULAR', 2, 200.00, 0.00, 400.00, '2026-03-06 03:18:30.990275');
INSERT INTO public.order_items VALUES (19, 20, 9, 'Mutton Soup', 'MB-004', 2, 15.00, 0.00, 30.00, '2026-03-06 03:18:30.990277');
INSERT INTO public.order_items VALUES (20, 20, 7, 'Mutton Biriyani', 'MB-002', 2, 11.00, 0.00, 22.00, '2026-03-06 03:18:30.990278');
INSERT INTO public.order_items VALUES (21, 21, 15, 'Chicken Pizza', 'Kavi0404', 1, 250.00, 0.00, 250.00, '2026-03-06 03:19:48.585362');
INSERT INTO public.order_items VALUES (22, 21, 13, 'Chicken Noodles', 'BURG001', 1, 120.00, 0.00, 120.00, '2026-03-06 03:19:48.585367');
INSERT INTO public.order_items VALUES (23, 21, 9, 'Mutton Soup', 'MB-004', 1, 15.00, 0.00, 15.00, '2026-03-06 03:19:48.585369');
INSERT INTO public.order_items VALUES (24, 22, 9, 'Mutton Soup', 'MB-004', 1, 15.00, 0.00, 15.00, '2026-03-08 05:18:14.905652');
INSERT INTO public.order_items VALUES (25, 23, 22, 'gopi Sauce Pasta', 'gopi001', 1, 180.00, 0.00, 180.00, '2026-03-08 06:56:17.797837');
INSERT INTO public.order_items VALUES (26, 24, 23, 'Test Product', 'FIXTEST001', 1, 100.00, 0.00, 100.00, '2026-03-08 07:56:50.792632');
INSERT INTO public.order_items VALUES (27, 25, 20, 'French Fries', 'FRIES001', 1, 99.00, 0.00, 99.00, '2026-03-08 10:46:09.353145');
INSERT INTO public.order_items VALUES (28, 26, 22, 'gopi Sauce Pasta', 'gopi001', 10, 180.00, 0.00, 1800.00, '2026-03-08 11:08:58.51635');
INSERT INTO public.order_items VALUES (29, 27, 12, 'Chicken Noodles', 'BURGER001', 1, 120.00, 0.00, 120.00, '2026-03-08 11:12:48.450181');
INSERT INTO public.order_items VALUES (30, 27, 16, 'Chicken Pizza', 'PI-02', 1, 250.00, 0.00, 250.00, '2026-03-08 11:12:48.450186');
INSERT INTO public.order_items VALUES (31, 27, 4, 'ChickenBurger', 'string', 1, 1.00, 0.00, 1.00, '2026-03-08 11:12:48.450188');
INSERT INTO public.order_items VALUES (32, 28, 20, 'French Fries', 'FRIES001', 1, 99.00, 0.00, 99.00, '2026-03-08 11:17:07.66104');
INSERT INTO public.order_items VALUES (33, 29, 7, 'Mutton Biriyani', 'MB-002', 1, 11.00, 0.00, 11.00, '2026-03-09 01:01:27.963886');
INSERT INTO public.order_items VALUES (34, 30, 17, 'Nuggets', 'ROLL003', 1, 250.00, 0.00, 250.00, '2026-03-09 01:11:51.145248');


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.orders VALUES (7, 'ORD-20260209-667FB56E', NULL, 3, 'PENDING', 'upi', 200.00, 0.00, 0.00, 200.00, '', '2026-02-09 08:56:00.016341', '2026-02-09 08:56:00.016345', NULL);
INSERT INTO public.orders VALUES (8, 'ORD-20260209-E7A9830A', 1, 3, 'PENDING', 'upi', 11.00, 0.00, 0.00, 11.00, '', '2026-02-09 08:56:30.476804', '2026-02-09 08:56:30.476809', NULL);
INSERT INTO public.orders VALUES (9, 'ORD-20260209-F1637BB1', NULL, 3, 'PENDING', 'cash', 10.00, 0.00, 0.00, 10.00, '', '2026-02-09 09:00:54.774597', '2026-02-09 09:00:54.774602', NULL);
INSERT INTO public.orders VALUES (10, 'ORD-20260209-2ADBFB70', 1, 3, 'PENDING', 'card', 10.00, 0.00, 0.00, 10.00, '', '2026-02-09 09:01:21.800368', '2026-02-09 09:01:21.800373', NULL);
INSERT INTO public.orders VALUES (14, 'ORD-20260226-D7BFEC11', 2, 3, 'PENDING', 'card', 1.00, 0.00, 0.00, 1.00, '', '2026-02-26 14:38:42.530798', '2026-02-26 14:38:42.530803', NULL);
INSERT INTO public.orders VALUES (15, 'ORD-20260226-CD4582E9', NULL, 3, 'PENDING', 'cash', 130.00, 0.00, 0.00, 130.00, '', '2026-02-26 14:39:50.882785', '2026-02-26 14:39:50.882789', NULL);
INSERT INTO public.orders VALUES (16, 'ORD-20260226-E3606BBF', NULL, 3, 'PENDING', 'upi', 99.00, 0.00, 0.00, 99.00, '', '2026-02-26 14:41:24.168255', '2026-02-26 14:41:24.168259', NULL);
INSERT INTO public.orders VALUES (17, 'ORD-20260226-66935C61', NULL, 3, 'PENDING', 'pending', 640.00, 0.00, 0.00, 640.00, '', '2026-02-26 15:08:15.248522', '2026-02-26 15:08:15.248527', NULL);
INSERT INTO public.orders VALUES (18, 'ORD-20260301-E8054630', 1, 3, 'PENDING', 'upi', 250.00, 0.00, 0.00, 250.00, '', '2026-03-01 15:52:52.984076', '2026-03-01 15:52:52.984092', NULL);
INSERT INTO public.orders VALUES (19, 'ORD-20260306-01CD66B8', 1, 3, 'PENDING', 'card', 100.00, 0.00, 0.00, 100.00, '', '2026-03-06 00:52:43.494516', '2026-03-06 00:52:43.49452', NULL);
INSERT INTO public.orders VALUES (20, 'ORD-20260306-CFAEA051', NULL, 3, 'PENDING', 'upi', 692.00, 0.00, 478.86, 213.14, '', '2026-03-06 03:18:30.971902', '2026-03-06 03:18:30.971906', NULL);
INSERT INTO public.orders VALUES (21, 'ORD-20260306-73DED7A2', NULL, 3, 'PENDING', 'cash', 385.00, 0.00, 0.00, 385.00, '', '2026-03-06 03:19:48.576466', '2026-03-06 03:19:48.57647', NULL);
INSERT INTO public.orders VALUES (22, 'ORD-20260308-792E90B5', 2, 3, 'PENDING', 'upi', 15.00, 0.00, 0.00, 15.00, '', '2026-03-08 05:18:13.585169', '2026-03-08 05:18:13.585178', NULL);
INSERT INTO public.orders VALUES (23, 'ORD-20260308-966DA022', 1, 3, 'PENDING', 'upi', 180.00, 0.00, 0.00, 180.00, '', '2026-03-08 06:56:17.78299', '2026-03-08 06:56:17.782995', NULL);
INSERT INTO public.orders VALUES (24, 'ORD-20260308-D7F8C33D', 2, 3, 'PENDING', 'cash', 100.00, 0.00, 0.00, 100.00, '', '2026-03-08 07:56:50.78219', '2026-03-08 07:56:50.782195', NULL);
INSERT INTO public.orders VALUES (25, 'ORD-20260308-AD3DB4E3', 1, 3, 'PENDING', 'cash', 99.00, 0.00, 0.00, 99.00, '', '2026-03-08 10:46:09.339749', '2026-03-08 10:46:09.339754', NULL);
INSERT INTO public.orders VALUES (26, 'ORD-20260308-1B1633B4', 2, 3, 'PENDING', 'upi', 1800.00, 0.00, 0.00, 1800.00, '', '2026-03-08 11:08:58.499354', '2026-03-08 11:08:58.499359', NULL);
INSERT INTO public.orders VALUES (27, 'ORD-20260308-47B86613', 1, 3, 'PENDING', 'upi', 371.00, 0.00, 0.00, 371.00, '', '2026-03-08 11:12:48.438498', '2026-03-08 11:12:48.438503', NULL);
INSERT INTO public.orders VALUES (28, 'ORD-20260308-15436FF0', 1, 3, 'PENDING', 'upi', 99.00, 0.00, 0.00, 99.00, '', '2026-03-08 11:17:07.648686', '2026-03-08 11:17:07.648691', NULL);
INSERT INTO public.orders VALUES (29, 'ORD-20260309-641DAF66', 2, 3, 'PENDING', 'upi', 11.00, 0.00, 0.00, 11.00, '', '2026-03-09 01:01:27.634192', '2026-03-09 01:01:27.634199', NULL);
INSERT INTO public.orders VALUES (30, 'ORD-20260309-ED5AFB89', 2, 3, 'PENDING', 'upi', 250.00, 0.00, 0.00, 250.00, '', '2026-03-09 01:11:50.60081', '2026-03-09 01:11:50.6016', NULL);


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: pricing_bundles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.pricing_bundles VALUES (1, 'pos-customer', '["POS", "Menu", "Customer"]', 1500, 10, 1490);
INSERT INTO public.pricing_bundles VALUES (2, 'pos-menu', '["POS", "Menu", "Offer"]', 1450, 20, 1430);
INSERT INTO public.pricing_bundles VALUES (3, 'menu-dashboard', '["POS", "Dashboard", "Menu"]', 1800, 50, 1750);


--
-- Data for Name: pricing_modules; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.pricing_modules VALUES (1, 'POS', 1000, true);
INSERT INTO public.pricing_modules VALUES (2, 'Dashboard', 500, false);
INSERT INTO public.pricing_modules VALUES (3, 'Menu', 300, false);
INSERT INTO public.pricing_modules VALUES (4, 'Customer', 200, false);
INSERT INTO public.pricing_modules VALUES (5, 'Offer', 150, false);
INSERT INTO public.pricing_modules VALUES (6, 'KOT', 250, false);
INSERT INTO public.pricing_modules VALUES (7, 'Reports', 400, false);


--
-- Data for Name: print_jobs; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.print_jobs VALUES (2, 23, '192.168.1.50', 9100, 'TEST KOT
1 x Burger', '2026-03-08 07:40:23.825471', NULL, 'pending');
INSERT INTO public.print_jobs VALUES (3, 28, '192.168.1.150', 9100, '              MY RESTAURANT               
==========================================
KOT #: ORD-20260308-15436FF0
Table: N/A
Date: 08-03-2026 11:17
------------------------------------------
QTY  ITEM                                
------------------------------------------
1    French Fries                        
==========================================




V', '2026-03-08 11:17:07.671731', NULL, 'pending');
INSERT INTO public.print_jobs VALUES (4, 29, '192.168.1.150', 9100, '              MY RESTAURANT               
==========================================
KOT #: ORD-20260309-641DAF66
Table: N/A
Date: 09-03-2026 01:01
------------------------------------------
QTY  ITEM                                
------------------------------------------
1    Mutton Biriyani                     
==========================================




V', '2026-03-09 01:01:28.414197', NULL, 'pending');
INSERT INTO public.print_jobs VALUES (5, 30, '192.168.1.150', 9100, '              MY RESTAURANT               
==========================================
KOT #: ORD-20260309-ED5AFB89
Table: N/A
Date: 09-03-2026 01:11
------------------------------------------
QTY  ITEM                                
------------------------------------------
1    Nuggets                             
==========================================




V', '2026-03-09 01:11:51.676945', NULL, 'pending');


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.products VALUES (10, 'TEA-REGULAR', 'Tea (Regular)', NULL, NULL, 10.00, NULL, 0, 0, true, NULL, 2, '2026-02-09 08:33:18.206016', '2026-02-09 08:33:18.206022');
INSERT INTO public.products VALUES (11, 'TEA-MEDIUM-', 'Tea (Medium )', NULL, NULL, 15.00, NULL, 0, 0, true, NULL, 2, '2026-02-09 08:33:18.835491', '2026-02-09 08:33:18.835499');
INSERT INTO public.products VALUES (5, 's', 'Mutton Biriyani', 'yumyum biriyani', '9876', 11.00, 300.00, 199, 1, true, 'string', 1, '2026-02-09 08:23:38.282048', '2026-02-09 08:56:30.900045');
INSERT INTO public.products VALUES (19, 'RAJ07', 'Campa', 'drink', NULL, 250.00, 150.00, 40, 5, true, 'https://billing-software-images.s3.ap-south-1.amazonaws.com/5ce67a76-2f40-48a4-b49b-f7d5274417d2.jpg', 2, '2026-02-22 12:21:41.083333', '2026-02-22 12:21:41.083338');
INSERT INTO public.products VALUES (13, 'BURG001', 'Chicken Noodles', 'Spicy chicken burger', NULL, 120.00, 80.00, 47, 5, true, 'https://billing-software-images.s3.ap-south-1.amazonaws.com/5ce67a76-2f40-48a4-b49b-f7d5274417d2.jpg', 1, '2026-02-22 12:04:40.150615', '2026-03-06 03:19:48.581918');
INSERT INTO public.products VALUES (15, 'Kavi0404', 'Chicken Pizza', 'Cheesy spicy pizza', NULL, 250.00, 150.00, 39, 5, true, 'https://billing-software-images.s3.ap-south-1.amazonaws.com/5ce67a76-2f40-48a4-b49b-f7d5274417d2.jpg', 1, '2026-02-22 12:14:24.893463', '2026-03-06 03:19:48.58192');
INSERT INTO public.products VALUES (9, 'MB-004', 'Mutton Soup', 'Masala Drink', '807262', 15.00, 250.00, 296, 1, true, 'string', 1, '2026-02-09 08:27:08.34596', '2026-03-08 05:18:14.563777');
INSERT INTO public.products VALUES (3, '7UP-REGULAR', '7UP (Regular)', NULL, NULL, 10.00, NULL, 46, 0, true, NULL, 2, '2026-02-09 06:48:56.275276', '2026-02-26 15:08:15.261262');
INSERT INTO public.products VALUES (14, 'PIZZA001', 'Chicken Pizza', 'Cheesy spicy pizza', NULL, 250.00, 150.00, 39, 5, true, 'https://billing-software-images.s3.ap-south-1.amazonaws.com/5ce67a76-2f40-48a4-b49b-f7d5274417d2.jpg', 1, '2026-02-22 12:13:01.231314', '2026-02-26 15:08:15.261268');
INSERT INTO public.products VALUES (21, 'PASTA1001', 'White Sauce Pasta', 'Creamy white sauce pasta', NULL, 180.00, 120.00, 34, 5, true, 'https://billing-software-images.s3.ap-south-1.amazonaws.com/5ce67a76-2f40-48a4-b49b-f7d5274417d2.jpg', 1, '2026-02-22 13:31:50.073743', '2026-02-26 15:08:15.261272');
INSERT INTO public.products VALUES (2, 'CHEESE-BURGER-REGULAR', 'Cheese Burger (Regular)', NULL, NULL, 200.00, NULL, 97, 0, true, NULL, 1, '2026-02-09 06:45:02.108454', '2026-03-06 03:18:30.983966');
INSERT INTO public.products VALUES (23, 'FIXTEST001', 'Test Product', 'Testing fix', NULL, 100.00, 50.00, 7, 2, true, 'https://billing-software-images.s3.ap-south-1.amazonaws.com/5ce67a76-2f40-48a4-b49b-f7d5274417d2.jpg', 1, '2026-02-22 13:46:10.118469', '2026-03-08 07:56:50.790799');
INSERT INTO public.products VALUES (22, 'gopi001', 'gopi Sauce Pasta', 'Creamy white sauce pasta', NULL, 180.00, 120.00, 24, 5, true, 'https://billing-software-images.s3.ap-south-1.amazonaws.com/5ce67a76-2f40-48a4-b49b-f7d5274417d2.jpg', 1, '2026-02-22 13:37:54.321823', '2026-03-08 11:08:58.512578');
INSERT INTO public.products VALUES (4, 'string', 'ChickenBurger', 'Spicy', '12345', 1.00, 100.00, 97, 10, true, 'string', 1, '2026-02-09 08:19:43.68954', '2026-03-08 11:12:48.44536');
INSERT INTO public.products VALUES (12, 'BURGER001', 'Chicken Noodles', 'Spicy chicken burger', NULL, 120.00, 80.00, 48, 5, true, 'https://billing-software-images.s3.ap-south-1.amazonaws.com/5ce67a76-2f40-48a4-b49b-f7d5274417d2.jpg', 1, '2026-02-22 12:04:12.130356', '2026-03-08 11:12:48.445364');
INSERT INTO public.products VALUES (16, 'PI-02', 'Chicken Pizza', 'Cheesy spicy pizza', NULL, 250.00, 150.00, 39, 5, true, 'https://billing-software-images.s3.ap-south-1.amazonaws.com/5ce67a76-2f40-48a4-b49b-f7d5274417d2.jpg', 1, '2026-02-22 12:16:09.552217', '2026-03-08 11:12:48.445366');
INSERT INTO public.products VALUES (20, 'FRIES001', 'French Fries', 'Crispy salted fries', NULL, 99.00, 60.00, 21, 5, true, 'https://billing-software-images.s3.ap-south-1.amazonaws.com/5ce67a76-2f40-48a4-b49b-f7d5274417d2.jpg', 1, '2026-02-22 13:25:19.28764', '2026-03-08 11:17:07.655489');
INSERT INTO public.products VALUES (7, 'MB-002', 'Mutton Biriyani', 'yumyum biriyani', '9876002', 11.00, 300.00, 197, 1, true, 'string', 1, '2026-02-09 08:25:38.306822', '2026-03-09 01:01:27.864308');
INSERT INTO public.products VALUES (17, 'ROLL003', 'Nuggets', 'Cheesy spicy pizza', NULL, 250.00, 150.00, 38, 5, true, 'https://billing-software-images.s3.ap-south-1.amazonaws.com/5ce67a76-2f40-48a4-b49b-f7d5274417d2.jpg', 1, '2026-02-22 12:18:15.367724', '2026-03-09 01:11:51.01889');
INSERT INTO public.products VALUES (25, 'NORTHSWEE-REGULAR', 'northswee (Regular)', NULL, NULL, 100.00, NULL, 0, 0, true, 'https://billing-software-images.s3.ap-south-1.amazonaws.com/78f2fbf9-3b63-4775-94fa-84b57d1b0c88.png', 3, '2026-03-14 08:35:51.412068', '2026-03-14 08:35:51.412074');


--
-- Data for Name: staff; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.staff VALUES (1, 'raveena', '9878934563', 'Cashier', 1000, '2026-02-09', '1234 4567 8976', true, '2026-02-09 09:25:46.49997', '2026-02-09 09:25:46.49997');
INSERT INTO public.staff VALUES (2, 'rose', '9456345612', 'Chef', 10, '2026-01-09', '123456789876', true, '2026-02-09 10:12:28.578799', '2026-02-09 10:12:28.578799');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users VALUES (1, 'Kavitha', 'kavi@example.com', '$2b$12$.6hOCTd/1jx07SW1XREr6u5XKy0ic0fO8xVxqfVz7AcAWEZD6pbS.', 'Kavitha Sonchalam', '1234567891', 'CASHIER', true, false, '2026-02-09 05:01:58.347857', '2026-02-09 05:01:58.347869', NULL);
INSERT INTO public.users VALUES (2, 'KaviSri', 'kavisri@example.com', '$2b$12$lSiNOpIIWn25SK6viBMfSux.Lk.4s/KyhR/WkRJzJcFrvfc2.l91y', 'Kavitha Sri', '8072620345', 'ADMIN', true, false, '2026-02-09 05:03:21.695067', '2026-02-09 05:03:21.695076', NULL);
INSERT INTO public.users VALUES (3, 'newadmin', 'user@example.com', '$2b$12$1ZHW4eNzFpsy.F7JrX1BFuM0QD2lmLZqbd5Cc38rUYMlLZwYgulVO', 'Admin', '1231231233', 'ADMIN', true, false, '2026-02-09 06:17:53.979585', '2026-02-09 06:23:13.750009', NULL);
INSERT INTO public.users VALUES (4, 'anusha3', 'anusha3@mail.com', '$2b$12$lQbT.QkG74aFHQ0BzG6V2OSfKYP1c1K9VAW7Sk2/YQKu6F12BTVO.', 'Tickets', '8056129665', 'CASHIER', true, false, '2026-02-24 15:50:20.09108', '2026-02-24 15:50:20.091086', NULL);
INSERT INTO public.users VALUES (5, 'vaibhavparitala63', 'vaibhavparitala63@gmail.com', '$2b$12$yBGy/Z6r2o.hZVhLK2nGguBpsnFNAY.XuhycPaOmDYpwIChqq3Qz.', 'Paritala Venkata vaibhav', '8985505293', 'CASHIER', true, false, '2026-03-06 04:40:13.114723', '2026-03-06 04:40:13.114728', NULL);
INSERT INTO public.users VALUES (6, 'venkatavaibhavparitala', 'venkatavaibhavparitala@gmail.com', '$2b$12$Cxsog2NxZcrIRnehZIeYyecU2Fj.IR8O.6rsSR1uZKDQoMF9Q5JAq', 'Vaibhav', '8985505293', 'CASHIER', true, false, '2026-03-06 04:44:00.875376', '2026-03-06 04:44:00.875382', NULL);
INSERT INTO public.users VALUES (7, 'raveena192003', 'raveena192003@gmail.com', '$2b$12$Nnf8M5U.689DbEQan.EYj.c9zGMY2gZFqh2qsCry35R/nzH9enzh2', 'Raveena', '9025494873', 'CASHIER', true, false, '2026-04-03 07:30:44.157184', '2026-04-03 07:30:44.157189', NULL);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categories_id_seq', 3, true);


--
-- Name: clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.clients_id_seq', 9, true);


--
-- Name: coupon_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.coupon_categories_id_seq', 1, false);


--
-- Name: coupons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.coupons_id_seq', 7, true);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customers_id_seq', 3, true);


--
-- Name: dish_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.dish_templates_id_seq', 1, false);


--
-- Name: email_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.email_templates_id_seq', 2, true);


--
-- Name: expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.expenses_id_seq', 4, true);


--
-- Name: inventory_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_logs_id_seq', 36, true);


--
-- Name: landing_pricing_features_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.landing_pricing_features_id_seq', 1, false);


--
-- Name: leads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.leads_id_seq', 12, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 28, true);


--
-- Name: order_coupons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.order_coupons_id_seq', 1, false);


--
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.order_items_id_seq', 34, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.orders_id_seq', 30, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payments_id_seq', 1, false);


--
-- Name: pricing_bundles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pricing_bundles_id_seq', 3, true);


--
-- Name: pricing_modules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pricing_modules_id_seq', 7, true);


--
-- Name: print_jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.print_jobs_id_seq', 5, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.products_id_seq', 25, true);


--
-- Name: staff_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.staff_id_seq', 2, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 7, true);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: coupon_categories coupon_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_categories
    ADD CONSTRAINT coupon_categories_pkey PRIMARY KEY (id);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: dish_templates dish_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dish_templates
    ADD CONSTRAINT dish_templates_pkey PRIMARY KEY (id);


--
-- Name: email_templates email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: inventory_logs inventory_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_pkey PRIMARY KEY (id);


--
-- Name: landing_pricing_features landing_pricing_features_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.landing_pricing_features
    ADD CONSTRAINT landing_pricing_features_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: order_coupons order_coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_coupons
    ADD CONSTRAINT order_coupons_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: pricing_bundles pricing_bundles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pricing_bundles
    ADD CONSTRAINT pricing_bundles_pkey PRIMARY KEY (id);


--
-- Name: pricing_modules pricing_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pricing_modules
    ADD CONSTRAINT pricing_modules_pkey PRIMARY KEY (id);


--
-- Name: print_jobs print_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.print_jobs
    ADD CONSTRAINT print_jobs_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: staff staff_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_categories_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_categories_id ON public.categories USING btree (id);


--
-- Name: ix_categories_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_categories_name ON public.categories USING btree (name);


--
-- Name: ix_clients_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_clients_id ON public.clients USING btree (id);


--
-- Name: ix_coupon_categories_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_coupon_categories_id ON public.coupon_categories USING btree (id);


--
-- Name: ix_coupons_code; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_coupons_code ON public.coupons USING btree (code);


--
-- Name: ix_coupons_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_coupons_id ON public.coupons USING btree (id);


--
-- Name: ix_customers_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_customers_email ON public.customers USING btree (email);


--
-- Name: ix_customers_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_customers_id ON public.customers USING btree (id);


--
-- Name: ix_customers_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_customers_phone ON public.customers USING btree (phone);


--
-- Name: ix_dish_templates_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_dish_templates_id ON public.dish_templates USING btree (id);


--
-- Name: ix_dish_templates_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_dish_templates_name ON public.dish_templates USING btree (name);


--
-- Name: ix_email_templates_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_email_templates_id ON public.email_templates USING btree (id);


--
-- Name: ix_email_templates_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_email_templates_name ON public.email_templates USING btree (name);


--
-- Name: ix_expenses_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_expenses_id ON public.expenses USING btree (id);


--
-- Name: ix_inventory_logs_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_inventory_logs_id ON public.inventory_logs USING btree (id);


--
-- Name: ix_landing_pricing_features_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_landing_pricing_features_id ON public.landing_pricing_features USING btree (id);


--
-- Name: ix_leads_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_leads_id ON public.leads USING btree (id);


--
-- Name: ix_notifications_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_notifications_id ON public.notifications USING btree (id);


--
-- Name: ix_order_coupons_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_order_coupons_id ON public.order_coupons USING btree (id);


--
-- Name: ix_order_items_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_order_items_id ON public.order_items USING btree (id);


--
-- Name: ix_orders_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_orders_id ON public.orders USING btree (id);


--
-- Name: ix_orders_order_number; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_orders_order_number ON public.orders USING btree (order_number);


--
-- Name: ix_payments_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_payments_id ON public.payments USING btree (id);


--
-- Name: ix_payments_transaction_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_payments_transaction_id ON public.payments USING btree (transaction_id);


--
-- Name: ix_pricing_bundles_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_pricing_bundles_id ON public.pricing_bundles USING btree (id);


--
-- Name: ix_pricing_bundles_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_pricing_bundles_name ON public.pricing_bundles USING btree (name);


--
-- Name: ix_pricing_modules_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_pricing_modules_id ON public.pricing_modules USING btree (id);


--
-- Name: ix_pricing_modules_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_pricing_modules_name ON public.pricing_modules USING btree (name);


--
-- Name: ix_print_jobs_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_print_jobs_id ON public.print_jobs USING btree (id);


--
-- Name: ix_products_barcode; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_products_barcode ON public.products USING btree (barcode);


--
-- Name: ix_products_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_products_id ON public.products USING btree (id);


--
-- Name: ix_products_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_products_name ON public.products USING btree (name);


--
-- Name: ix_products_sku; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_products_sku ON public.products USING btree (sku);


--
-- Name: ix_staff_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_staff_id ON public.staff USING btree (id);


--
-- Name: ix_staff_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_staff_phone ON public.staff USING btree (phone);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);


--
-- Name: coupon_categories coupon_categories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_categories
    ADD CONSTRAINT coupon_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: coupon_categories coupon_categories_coupon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_categories
    ADD CONSTRAINT coupon_categories_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(id);


--
-- Name: coupons coupons_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: dish_templates dish_templates_default_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dish_templates
    ADD CONSTRAINT dish_templates_default_category_id_fkey FOREIGN KEY (default_category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: inventory_logs inventory_logs_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: inventory_logs inventory_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: order_coupons order_coupons_coupon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_coupons
    ADD CONSTRAINT order_coupons_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(id);


--
-- Name: order_coupons order_coupons_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_coupons
    ADD CONSTRAINT order_coupons_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: payments payments_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: print_jobs print_jobs_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.print_jobs
    ADD CONSTRAINT print_jobs_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict yluGhldGqhsJz1EMK9FUNg36qOo1fMnahmBBLfngx1RYngdhPwcotzEYc0k55MT

