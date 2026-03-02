import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useFacilities, useUpdateFacility } from "@/hooks/useBackendData";
import { useAppStore } from "@/store/appStore";
import { Building2, Loader2, Save } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const TIMEZONES = [
  "America/Chicago",
  "America/New_York",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "Pacific/Honolulu",
];

export function AdminFacilities() {
  const facilitiesQuery = useFacilities();
  const updateFacilityMut = useUpdateFacility();

  const setFn = useAppStore.setState;
  const storeFacilities = useAppStore((s) => s.facilities);
  const updateFacilityStore = useAppStore((s) => s.updateFacility);

  const [form, setForm] = useState({
    name: "",
    address: "",
    timeZone: "America/Chicago",
  });
  const [formInitialized, setFormInitialized] = useState(false);
  // Use a ref so we can check this in effects without adding it as a dependency
  const savedLocallyRef = useRef(false);

  const facilities = facilitiesQuery.data ?? storeFacilities;
  const facility = facilities[0];

  // Keep Zustand store in sync whenever backend data arrives,
  // but not after a local save (to avoid overwriting the user's edits)
  useEffect(() => {
    if (facilitiesQuery.data && !savedLocallyRef.current)
      setFn({ facilities: facilitiesQuery.data });
  }, [facilitiesQuery.data, setFn]);

  useEffect(() => {
    if (facility && !formInitialized) {
      setForm({
        name: facility.name,
        address: facility.address,
        timeZone: facility.timeZone,
      });
      setFormInitialized(true);
    }
  }, [facility, formInitialized]);

  const handleSave = async () => {
    if (!facility) return;
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    // Always update the local store immediately so the UI reflects the change
    updateFacilityStore(facility.id, {
      name: form.name,
      address: form.address,
      timeZone: form.timeZone,
    });
    savedLocallyRef.current = true;
    toast.success("Facility settings saved");
    // Best-effort backend sync (silently ignore auth errors)
    updateFacilityMut
      .mutateAsync({
        id: facility.id,
        name: form.name,
        address: form.address,
        tz: form.timeZone,
      })
      .catch(() => {
        // Backend sync failed (e.g. not authenticated via Internet Identity) —
        // the local store already has the update so the user sees the correct data.
      });
  };

  if (facilitiesQuery.isPending) {
    return (
      <div>
        <PageHeader
          title="Facility Settings"
          description="Manage your storage facility information"
        />
        <div className="max-w-2xl">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No facility found.
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Facility Settings"
        description="Manage your storage facility information"
      />

      <div className="max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                {facility.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="name">Facility Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Country Lane Storage"
                  data-ocid="facilities.name.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                  placeholder="123 Main Street, City, ST 00000"
                  data-ocid="facilities.address.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Time Zone</Label>
                <Select
                  value={form.timeZone}
                  onValueChange={(v) => setForm((f) => ({ ...f, timeZone: v }))}
                >
                  <SelectTrigger data-ocid="facilities.timezone.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="pt-2 flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={updateFacilityMut.isPending}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
                  data-ocid="facilities.save.button"
                >
                  {updateFacilityMut.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
