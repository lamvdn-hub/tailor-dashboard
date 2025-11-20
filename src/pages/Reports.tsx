import { BarChart3 } from 'lucide-react';
import { Card } from '../components/Card';

export function Reports() {

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports</h1>

      <Card>
        <div className="flex items-start gap-4">
          <BarChart3 className="w-8 h-8 text-[#506B4D] mt-1" />
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Analytics</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Advanced analytics and reporting features will be available here in future updates.
              This will include session trends, popular garment types, fabric usage statistics, and more.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
