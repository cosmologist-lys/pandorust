// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use pandorust_core::components::RpcResponse;
use quick_find_core::QuickFindRespond;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![quick_find_search])
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
