// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;
use pandorust_core::custom_err::PanError;

fn main() {
    pandorust_lib::run()
    /*let f = quick_find_core::search("C:\\Lys\\software","*.dll");
    match f {
        Ok(r) => {println!("ok : {:?}",r)}
        Err(e) => {println!("error : {}",e)}
    }*/
}
