require("dotenv").config()

module.exports = {
  JWT_SECRET: process.env.JWT,
  AI_API: process.env.AIGEN,
  FE1: process.env.FE1addr,
  FE2: process.env.FE2addr,
  LOCAL_FE1: process.env.localFE1addr,
  LOCAL_FE2: process.env.localFE2addr,
}
