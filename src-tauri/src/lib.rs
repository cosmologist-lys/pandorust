// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use pandorust_core::components::RpcResponse;
use project_cleanser::parts::{CleanResult, ProjectCleanserRespond};
use quick_find_core::QuickFindRespond;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            quick_find_search,
            scan_projects,
            remove_targets
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn quick_find_search(root_path: String, glob_pattern: String) -> RpcResponse<QuickFindRespond> {
    let search_result =
        tokio::task::spawn_blocking(move || quick_find_core::search(&root_path, &glob_pattern))
            .await
            .unwrap(); // 处理 spawn_blocking 本身的错误
    match search_result {
        Ok(good) => RpcResponse::ok(good),
        Err(error) => RpcResponse::err(error)
    }
}


#[tauri::command]
fn scan_projects(root_path: String, project_type: String) -> RpcResponse<ProjectCleanserRespond> {
    let targets = project_cleanser::scan_projects(&root_path,&project_type);
    match targets {
        Ok(good) => RpcResponse::ok(good),
        Err(error) => RpcResponse::err(error)
    }
}

#[tauri::command]
fn remove_targets(targets: Vec<CleanResult>) -> RpcResponse<ProjectCleanserRespond> {
    let targets = project_cleanser::remove_targets(targets);
    match targets {
        Ok(good) => RpcResponse::ok(good),
        Err(error) => RpcResponse::err(error)
    }
}