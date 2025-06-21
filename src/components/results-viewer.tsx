import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ResultsViewerProps {
  data: any;
  format?: 'table' | 'cards';
}

export function ResultsViewer({ data, format = 'table' }: ResultsViewerProps) {
  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <p>No results to display.</p>
        </CardContent>
      </Card>
    );
  }

  if (format === 'table') {
    const headers = Object.keys(data);
    const values = Object.values(data);

    return (
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Field</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {headers.map((header, index) => (
              <TableRow key={header}>
                <TableCell className="font-medium capitalize">{header.replace(/_/g, ' ')}</TableCell>
                <TableCell>{typeof values[index] === 'object' ? JSON.stringify(values[index]) : String(values[index])}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    );
  }
  
  // Card format
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Object.entries(data).map(([key, value]) => (
        <Card key={key}>
          <CardHeader>
            <CardTitle className="text-sm font-medium capitalize">{key.replace(/_/g, ' ')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{String(value)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
