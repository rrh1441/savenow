-- Growth calculation function
-- Formula: FV = P × (365/freq) × [((1+r)^n – 1)/r]
-- where r = 0.10 nominal annual return and n ∈ {10, 20, 30}

CREATE OR REPLACE FUNCTION calc_growth(
  price NUMERIC,
  freq_days INTEGER,
  years INTEGER DEFAULT 10,
  annual_return NUMERIC DEFAULT 0.10
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  annual_payment NUMERIC;
  future_value NUMERIC;
BEGIN
  -- Validate inputs
  IF price <= 0 OR freq_days <= 0 OR years <= 0 THEN
    RETURN 0;
  END IF;
  
  -- Calculate annual payment amount
  annual_payment := price * (365.0 / freq_days);
  
  -- Handle edge case where return rate is 0
  IF annual_return = 0 THEN
    RETURN annual_payment * years;
  END IF;
  
  -- Calculate future value using compound interest formula
  -- FV = PMT * [((1+r)^n - 1) / r]
  future_value := annual_payment * ((POWER(1 + annual_return, years) - 1) / annual_return);
  
  RETURN ROUND(future_value, 2);
END;
$$;

-- Create a function that returns projections for multiple time periods
CREATE OR REPLACE FUNCTION calc_growth_projections(
  price NUMERIC,
  freq_days INTEGER,
  annual_return NUMERIC DEFAULT 0.10
)
RETURNS TABLE(
  years INTEGER,
  total_invested NUMERIC,
  future_value NUMERIC,
  total_return NUMERIC
)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  annual_payment NUMERIC;
BEGIN
  -- Validate inputs
  IF price <= 0 OR freq_days <= 0 THEN
    RETURN;
  END IF;
  
  annual_payment := price * (365.0 / freq_days);
  
  -- Return projections for 10, 20, and 30 years
  FOR years IN SELECT unnest(ARRAY[10, 20, 30]) LOOP
    total_invested := annual_payment * years;
    
    IF annual_return = 0 THEN
      future_value := total_invested;
    ELSE
      future_value := annual_payment * ((POWER(1 + annual_return, years) - 1) / annual_return);
    END IF;
    
    total_return := future_value - total_invested;
    
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$;