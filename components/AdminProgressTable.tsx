import { Card, CardTitle } from "@/components/ui/card";

export function AdminProgressTable({
  title,
  rows,
}: {
  title: string;
  rows: Record<string, unknown>[];
}) {
  const headers = Object.keys(rows[0] ?? {});

  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-muted">
            <tr>
              {headers.map((header) => (
                <th className="pb-3 capitalize" key={header}>
                  {header.replaceAll(/([A-Z])/g, " $1")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr className="border-t border-white/5" key={`${title}-${index}`}>
                {headers.map((header) => (
                  <td className="py-3" key={header}>
                    {String(row[header] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
