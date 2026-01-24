-- Fix jobs table columns to support decimal values for pricing
ALTER TABLE jobs 
    ALTER COLUMN visiting_charges TYPE DECIMAL(10, 2),
    ALTER COLUMN spare_parts_cost TYPE DECIMAL(10, 2),
    ALTER COLUMN tax TYPE DECIMAL(10, 2),
    ALTER COLUMN total_cost TYPE DECIMAL(10, 2);

-- Also ensure service_pricing uses decimals (it likely does from creation, but good to be safe)
-- ALTER TABLE service_pricing 
--    ALTER COLUMN base_visiting_charge TYPE DECIMAL(10, 2),
--    ALTER COLUMN per_km_charge TYPE DECIMAL(10, 2);
