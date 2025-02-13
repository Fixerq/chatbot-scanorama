
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorLog } from "@/types/monitoring";

interface ErrorsListProps {
  errors: ErrorLog[];
}

export function ErrorsList({ errors }: ErrorsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Errors</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {errors?.map((error, index) => (
            <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
              <p className="text-red-500 font-medium">{error.unique_errors}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Occurred at {new Date(error.time_bucket).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Affected {error.affected_urls?.length || 0} URLs
              </p>
            </div>
          ))}
          {(!errors || errors.length === 0) && (
            <p className="text-muted-foreground">No recent errors</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
