import moduleReportHandler from "../../lib/server/moduleReport";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "8mb"
    }
  }
};

export default moduleReportHandler;
