'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function FuelReportsPage() {
  const router = useRouter();

  const reportOptions = [
    {
      title: 'Diesel Reports',
      options: [
        {
          name: 'Weekly Diesel Report',
          path: '/reports/fuel/diesel/weekly'
        }
      ]
    },
    {
      title: 'Petrol Reports',
      options: [
        {
          name: 'Weekly Petrol Report',
          path: '/reports/fuel/petrol/weekly'
        },
        {
          name: 'Petrol Consumption Report',
          path: '/reports/fuel/petrol/consumption'
        }
      ]
    },
    {
      title: 'Oil Reports',
      options: [
        {
          name: 'Oil Consumption Report',
          path: '/reports/fuel/oil/consumption'
        }
      ]
    }
  ];

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Fuel Reports</h1>
      <div className="grid gap-6">
        {reportOptions.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {section.options.map((option) => (
                  <Button
                    key={option.name}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push(option.path)}
                  >
                    {option.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 