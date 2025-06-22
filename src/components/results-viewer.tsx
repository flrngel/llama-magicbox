import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ResultsViewerProps {
  data: any;
  format?: 'auto' | 'table' | 'cards';
}

// Helper function to format field names
function formatFieldName(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper function to detect data types
function getDataType(value: any): 'array' | 'object' | 'boolean' | 'number' | 'string' | 'null' {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  return 'string';
}

// Component to render individual values based on type - simplified for clean table display
function ValueRenderer({ value, fieldName }: { value: any; fieldName: string }) {
  const dataType = getDataType(value);

  switch (dataType) {
    case 'null':
      return <span className="text-muted-foreground">-</span>;
      
    case 'boolean':
      return <span>{value ? "Yes" : "No"}</span>;
      
    case 'number':
      // Format numbers nicely (currency, percentages, etc.)
      const formattedNumber = fieldName.toLowerCase().includes('amount') || fieldName.toLowerCase().includes('price') || fieldName.toLowerCase().includes('cost')
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
        : fieldName.toLowerCase().includes('percent') || fieldName.toLowerCase().includes('rate')
        ? `${value}%`
        : value.toLocaleString();
      return <span>{formattedNumber}</span>;
      
    case 'string':
      // Handle multi-line text and long strings
      const normalizedValue = value.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
      const lines = normalizedValue.split('\n');
      if (lines.length > 1) {
        return (
          <div className="space-y-1">
            {lines.map((line: string, index: number) => (
              <div key={index}>
                {line.trim() || <span className="text-muted-foreground">-</span>}
              </div>
            ))}
          </div>
        );
      }
      return <span>{value}</span>;
      
    case 'array':
      // Special case: if this is an array of structured objects and it's a top-level field,
      // we might want to render it as a main table rather than nested
      if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null && 
          value.length > 3 && // Only for arrays with multiple items
          (fieldName.toLowerCase().includes('items') || 
           fieldName.toLowerCase().includes('entries') ||
           fieldName.toLowerCase().includes('records') ||
           fieldName.toLowerCase().includes('transactions'))) {
        return (
          <div className="space-y-3">
            <div className="text-sm font-medium">
              {formatFieldName(fieldName)} ({value.length} items)
            </div>
            <StructuredListRenderer items={value} />
          </div>
        );
      }
      return <ArrayRenderer items={value} fieldName={fieldName} />;
      
    case 'object':
      return <ObjectRenderer obj={value} />;
      
    default:
      return <span>{String(value)}</span>;
  }
}

// Component to render arrays as clean tables
function ArrayRenderer({ items, fieldName }: { items: any[]; fieldName: string }) {
  if (!items || items.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  // If array contains objects, render as a table
  if (items.length > 0 && typeof items[0] === 'object' && items[0] !== null) {
    const headers = [...new Set(items.flatMap(item => Object.keys(item)))];
    
    return (
      <div className="border rounded-md overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map(header => (
                <TableHead key={header} className="text-center align-middle">
                  {formatFieldName(header)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={index}>
                {headers.map(header => (
                  <TableCell key={header} className="break-words whitespace-pre-wrap align-top max-w-xs">
                    <ValueRenderer value={item[header]} fieldName={header} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // For simple arrays, render as a simple table
  return (
    <div className="border rounded-md overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center align-middle">{formatFieldName(fieldName)}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={index}>
              <TableCell>
                <ValueRenderer value={item} fieldName={fieldName} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Component to render nested objects as clean tables
function ObjectRenderer({ obj }: { obj: Record<string, any> }) {
  if (!obj || Object.keys(obj).length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <div className="border rounded-md overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center align-middle">Field</TableHead>
            <TableHead className="text-center align-middle">Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(obj).map(([key, value]) => (
            <TableRow key={key}>
              <TableCell className="font-medium">
                {formatFieldName(key)}
              </TableCell>
              <TableCell className="break-words whitespace-pre-wrap max-w-xs">
                <ValueRenderer value={value} fieldName={key} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Component to render a list of structured objects as a clean table
function StructuredListRenderer({ items }: { items: Record<string, any>[] }) {
  if (!items || items.length === 0) {
    return <span className="text-muted-foreground">No items to display</span>;
  }

  // Get all unique headers from all objects
  const headers = [...new Set(items.flatMap(item => Object.keys(item)))];
  
  return (
    <div className="border rounded-md overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map(header => (
              <TableHead key={header} className="align-top">
                {formatFieldName(header)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={index}>
              {headers.map(header => (
                <TableCell key={header} className="break-words whitespace-pre-wrap align-top max-w-xs">
                  <ValueRenderer value={item[header]} fieldName={header} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ResultsViewer({ data, format = 'auto' }: ResultsViewerProps) {
  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <p>No results to display.</p>
        </CardContent>
      </Card>
    );
  }

  // Special case: Check if the entire data is an array of structured objects
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
    return <StructuredListRenderer items={data} />;
  }

  // Auto-detect best format for object data
  if (format === 'auto') {
    const entries = Object.entries(data);
    const hasComplexData = entries.some(([, value]) => 
      Array.isArray(value) || (typeof value === 'object' && value !== null)
    );
    format = hasComplexData ? 'cards' : 'table';
  }

  if (format === 'table') {
    return (
      <Card>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px] text-center align-middle">Field</TableHead>
                <TableHead className="text-center align-middle">Value</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {Object.entries(data).map(([key, value]) => (
              <TableRow key={key}>
                <TableCell className="font-medium align-top">
                  {formatFieldName(key)}
                </TableCell>
                <TableCell className="break-words whitespace-pre-wrap align-top max-w-md">
                  <ValueRenderer value={value} fieldName={key} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
        </div>
      </Card>
    );
  }
  
  // Cards format - better for complex nested data
  return (
    <div className="space-y-4">
      {Object.entries(data).map(([key, value]) => {
        const dataType = getDataType(value);
        const isComplex = dataType === 'array' || dataType === 'object';
        
        return (
          <Card key={key}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                {formatFieldName(key)}
                <Badge variant="outline" className="text-xs">
                  {dataType}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className={isComplex ? "pt-0" : ""}>
              <ValueRenderer value={value} fieldName={key} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
