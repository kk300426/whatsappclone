import pg from "pg";
const {Pool}=pg;
const pool = new Pool ({connectionString:"postgresql://neondb_owner:npg_2TXHZK9FiDvh@ep-wild-glitter-aoza7djg-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"});

pool.on('connect',()=>{
    console.log("database connected");
});

pool.on('error',(err)=>{
    console.log("error connecting DB",err);
});

export default pool;
