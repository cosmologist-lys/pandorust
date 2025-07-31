// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

//use pandorust_core::custom_err::PanError;
//use project_cleanser::parts::ProjectCleanserRespond;

fn main() {
    pandorust_lib::run()
    /*let f = quick_find_core::search("C:\\Lys\\software","*.dll");
    match f {
        Ok(r) => {println!("ok : {:?}",r)}
        Err(e) => {println!("error : {}",e)}
    }*/
    /*let java_path = "C:\\Lys\\qwms-3.0\\payment-3.0";
    let rust_path = "C:\\Lys\\rust-project";
    let f = project_cleanser::scan_projects("C:\\Lys","any");
    match f {
        Ok(r) => {
            println!("count : {} , time-spent : {} , total-size : {}, occupied : {}", r.count, r.spent_millis,r.total_size,r.occupied);
            r.vec.iter().for_each(|one | println!("{:?}",one));
        }
        Err(e) => eprintln!("error : {}",e)
    }*/
}
