import { useEffect, useState, Suspense, lazy } from "react";
import { Zap } from "lucide-react";
import { LoaderCircle } from "lucide-react";
import { ScrollArea } from "./component/ScrollArea"; // Import the custom ScrollArea

interface DataItem {
  details: {
    name: string;
    google_status: string;
    status: string;
    mac: string;
    rid: string;
  };
}

interface NotificationProps {
  dataObject: DataItem[];
}

// Replace dynamic import with React.lazy
const DialogComponent = lazy(() => import("./component/ModalComponent"));

const Notification = ({ dataObject }: NotificationProps) => {
  const [posts, setPosts] = useState<{
    username: string;
    google: string;
    status: string;
    mac: string;
    rid: string;
  }[]>([]);
  
  useEffect(() => {
    const filterData = () => {
      return dataObject?.map((item) => ({
        username: item.details.name,
        google: item.details.google_status,
        status: item.details.status,
        mac: item.details.mac,
        rid: item.details.rid,
      }));
    };
    
    const filteredData = filterData();
    setPosts(filteredData);
  }, [dataObject]);
  
  return (
    <div className="rounded shadow-lg p-4 bg-[#18181B] border-secondary  sm:max-w-full lg:max-w-2xl mx-auto h-full">
      <div className="text-xs mb-4 flex items-center gap-2 text-white">
        <Zap className="w-4 h-4 text-yellow-500" />
        <span className="font-medium">Important Status</span>
      </div>
      <ScrollArea className="flex flex-col gap-1 p-1 text-xs w-full overflow-y-scroll scrollbar-hide rounded flex-grow">
        {posts.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-500 dark:text-gray-400">
            No data available
          </div>
        ) : (
          posts.map((post, index) => {
            if (post.status === "account_banned" || post.google === "captcha_required") {
              return (
                <div
                  key={index}
                  className="mb-1 flex items-center justify-between px-3 py-2 bg-white rounded shadow-sm dark:bg-[#121212] dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1E1E1E] transition duration-150 ease-in-out"
                >
                  {/* Left Section: Text */}
                  <div className="flex flex-col">
                    <div className="font-medium text-xs truncate">
                      {index + 1}. {post.username}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs truncate">
                      <span className="font-bold">
                        {post.status.toUpperCase()} | {post.google.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  {/* Dialog Component */}
                  <div className="ml-2">
                    <Suspense
                      fallback={
                        <div className="flex justify-center items-center animate-spin">
                          <LoaderCircle className="w-6 h-6 text-gray-500" />
                        </div>
                      }
                    >
                      <DialogComponent details={post} />
                    </Suspense>
                  </div>
                </div>
              );
            }
            return null;
          })
        )}
      </ScrollArea>
    </div>
  );
};

export default Notification;
