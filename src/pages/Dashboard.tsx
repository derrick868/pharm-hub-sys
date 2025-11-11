import { useEffect, useState } from "react";
import { AlertTriangle, Clock, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export default function ExpiryDashboard() {
  const [drugs, setDrugs] = useState([]);

  useEffect(() => {
    fetchDrugs();
  }, []);

  async function fetchDrugs() {
    const { data, error } = await supabase.from("drugs").select("*");
    if (error) console.error(error);
    else setDrugs(data);
  }

  const today = new Date();

  const expired = drugs.filter((drug) => new Date(drug.expiry_date) < today);
  const nearExpiry = drugs.filter((drug) => {
    const diffDays =
      (new Date(drug.expiry_date) - today) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 30;
  });

  return (
    <div className="p-6 grid gap-6 md:grid-cols-2">
      {/* Expired Drugs */}
      <Card className="border-red-500 shadow-lg">
        <CardHeader className="bg-red-600 text-white rounded-t-xl">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="w-5 h-5" />
            Expired Drugs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 bg-red-50">
          {expired.length > 0 ? (
            expired.map((drug) => (
              <div
                key={drug.id}
                className="flex justify-between items-center p-3 border-b border-red-200 last:border-none"
              >
                <div>
                  <h3 className="font-semibold text-red-700">
                    {drug.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Expired on: {format(new Date(drug.expiry_date), "PPP")}
                  </p>
                </div>
                <Badge variant="destructive">Expired</Badge>
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic">No expired drugs 🎉</p>
          )}
        </CardContent>
      </Card>

      {/* Near Expiry Drugs */}
      <Card className="border-yellow-400 shadow-lg">
        <CardHeader className="bg-yellow-500 text-white rounded-t-xl">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5" />
            Near Expiry (Next 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 bg-yellow-50">
          {nearExpiry.length > 0 ? (
            nearExpiry.map((drug) => (
              <div
                key={drug.id}
                className="flex justify-between items-center p-3 border-b border-yellow-200 last:border-none"
              >
                <div>
                  <h3 className="font-semibold text-yellow-800">
                    {drug.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Expires on: {format(new Date(drug.expiry_date), "PPP")}
                  </p>
                </div>
                <Badge className="bg-yellow-500 text-white">Soon</Badge>
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic">No drugs expiring soon ✅</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
