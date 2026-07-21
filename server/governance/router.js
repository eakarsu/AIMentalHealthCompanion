import express from 'express';
import pool from '../database.js';
import auth from '../middleware/auth.js';
import core from './workflowCore.cjs';
import factory from './routerFactory.cjs';
import config from './config.cjs';
const db={query:async(s,p)=>(await pool.query(s,p)).rows,transaction:async work=>{const c=await pool.connect();try{await c.query('BEGIN');const result=await work(async(s,p)=>(await c.query(s,p)).rows);await c.query('COMMIT');return result;}catch(error){await c.query('ROLLBACK');throw error;}finally{c.release();}}};
export default factory.createGovernedRouter({express,workflow:core.createWorkflow(config),auth,db});
