import { d as useNavigate } from "./router-BhzvWMaL.js";
import { S as reactExports } from "./server-BSs7-SCa.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
function AppRedirect() {
  const navigate = useNavigate();
  reactExports.useEffect(() => {
    navigate({
      to: "/app/gestao",
      replace: true
    });
  }, [navigate]);
  return null;
}
export {
  AppRedirect as component
};
