import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { createServerComponentClient } from "@/lib/supabase-server";

const t = initTRPC.create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const appRouter = router({
  searchItems: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      const supabase = await createServerComponentClient();
      
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .ilike("name", `%${input.query}%`)
        .limit(10);
      
      if (error) throw error;
      return data;
    }),

  getGrowthProjections: publicProcedure
    .input(z.object({
      price: z.number().positive(),
      frequencyDays: z.number().positive(),
      annualReturn: z.number().default(0.10)
    }))
    .query(async ({ input }) => {
      const supabase = await createServerComponentClient();
      
      const { data, error } = await supabase
        .rpc("calc_growth_projections", {
          price: input.price,
          freq_days: input.frequencyDays,
          annual_return: input.annualReturn
        });
      
      if (error) throw error;
      return data;
    }),

  saveScenario: publicProcedure
    .input(z.object({
      title: z.string().min(1),
      items: z.array(z.object({
        itemId: z.string().uuid().optional(),
        customName: z.string().optional(),
        price: z.number().positive(),
        frequencyDays: z.number().positive()
      }))
    }))
    .mutation(async ({ input }) => {
      const supabase = await createServerComponentClient();
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      
      const { data: scenario, error: scenarioError } = await supabase
        .from("scenarios")
        .insert({
          user_id: user.user.id,
          title: input.title
        })
        .select()
        .single();
      
      if (scenarioError) throw scenarioError;
      
      const scenarioItems = input.items.map(item => ({
        scenario_id: scenario.id,
        item_id: item.itemId,
        custom_item_name: item.customName,
        price_usd: item.price,
        frequency_days: item.frequencyDays
      }));
      
      const { error: itemsError } = await supabase
        .from("scenario_items")
        .insert(scenarioItems);
      
      if (itemsError) throw itemsError;
      
      return scenario;
    }),

  getUserScenarios: publicProcedure
    .query(async () => {
      const supabase = await createServerComponentClient();
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("scenarios")
        .select(`
          *,
          scenario_items (
            *,
            items (*)
          )
        `)
        .eq("user_id", user.user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    }),
});

export type AppRouter = typeof appRouter;