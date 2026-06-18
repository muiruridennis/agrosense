// app/test/page.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TestPage() {
  return (
    <div className="flex justify-center p-8">
      <Tabs defaultValue="tab1" className="w-full max-w-4xl">
        <TabsList className="h-12 w-full">
          <TabsTrigger value="tab1" className="flex-1">
            Tab 1
          </TabsTrigger>
          <TabsTrigger value="tab2" className="flex-1">
            Tab 2
          </TabsTrigger>
          <TabsTrigger value="tab3" className="flex-1">
            Tab 3
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tab1" className="mt-6">
          Content 1
        </TabsContent>

        <TabsContent value="tab2" className="mt-6">
          Content 2
        </TabsContent>

        <TabsContent value="tab3" className="mt-6">
          Content 3
        </TabsContent>
      </Tabs>
    </div>
  );
}