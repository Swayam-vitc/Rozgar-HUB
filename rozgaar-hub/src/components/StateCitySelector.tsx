import { useState, useEffect } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { STATES, getCitiesForState, type Location } from "@/lib/indianStatesAndCities";

interface StateCitySelectorProps {
    value: Location;
    onChange: (location: Location) => void;
    required?: boolean;
    disabled?: boolean;
}

export function StateCitySelector({
    value,
    onChange,
    required = false,
    disabled = false,
}: StateCitySelectorProps) {
    const [cities, setCities] = useState<string[]>([]);

    // Update cities when state changes
    useEffect(() => {
        if (value.state) {
            const stateCities = getCitiesForState(value.state);
            setCities(stateCities);

            // Reset city if it's not in the new state's cities
            if (value.city && !stateCities.includes(value.city)) {
                onChange({ ...value, city: "" });
            }
        } else {
            setCities([]);
            if (value.city) {
                onChange({ ...value, city: "" });
            }
        }
    }, [value.state]);

    const handleStateChange = (state: string) => {
        onChange({ state, city: "" });
    };

    const handleCityChange = (city: string) => {
        onChange({ ...value, city });
    };

    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="state">
                    State {required && <span className="text-destructive">*</span>}
                </Label>
                <Select
                    value={value.state}
                    onValueChange={handleStateChange}
                    disabled={disabled}
                    required={required}
                >
                    <SelectTrigger id="state">
                        <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                        {STATES.map((state) => (
                            <SelectItem key={state} value={state}>
                                {state}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label htmlFor="city">
                    City {required && <span className="text-destructive">*</span>}
                </Label>
                <Select
                    value={value.city}
                    onValueChange={handleCityChange}
                    disabled={disabled || !value.state}
                    required={required}
                >
                    <SelectTrigger id="city">
                        <SelectValue placeholder={value.state ? "Select city" : "Select state first"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                        {cities.map((city) => (
                            <SelectItem key={city} value={city}>
                                {city}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
