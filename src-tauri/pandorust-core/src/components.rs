use serde::{Deserialize, Serialize};
use crate::custom_err::PanError;

#[derive(Serialize,Deserialize,Clone,Debug)]
pub struct RpcResponse<T>{
    pub status: i8,
    pub data: Option<T>,
    pub error: String
}

impl <T> RpcResponse<T> {
    pub fn new(json: T, error: &Option<PanError>) -> Self {
        let wrap: (i8,String) = match error {
            None => (0,String::new()),
            Some(e) => (-1,e.to_string())
        };
        Self {
            status: wrap.0,
            data: Some(json),
            error: wrap.1
        }
    }

    pub fn ok(json: T) -> Self{
        Self {
            status: 0,
            data: Some(json),
            error: String::new()
        }
    }

    pub fn err(error: PanError) -> Self {
        Self {
            status: -1,
            data: None,
            error: error.to_string()
        }
    }
}