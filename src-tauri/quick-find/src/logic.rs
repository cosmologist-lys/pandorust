use crate::parts::QuickFindRespond;
use glob::Pattern;
use jwalk::WalkDir;
use log::info;
use pandorust_core::common_err;
use pandorust_core::custom_err::PanError;
use std::time::Instant;

pub fn search(root_path: &str, glob_patter: &str) -> Result<QuickFindRespond, PanError> {
    let start_time = Instant::now();
    let input = glob_patter.trim();

    let walker = WalkDir::new(root_path.trim()).follow_links(false);
    // 1. 判断输入是否包含glob通配符(只要是符合glob通配符规则的都会进入第一个if)
    let simple_suffix = if input.starts_with("*.")
        && !input[2..].contains('*')
        && !input[2..].contains('?')
        && !input[2..].contains('[')
    {
        Some(&input[1..]) // 如果是，提取后缀 ".dll"
    } else {
        None
    };

    if simple_suffix.is_some() {
        info!(
            "quick-find:[search] glob-suffix = {}",
            simple_suffix.unwrap()
        );
    }

    let search_result: Vec<String> = if let Some(suffix) = simple_suffix {
        // --- 针对 "*.ext" 模式的特化、高速路径 ---
        walker
            .into_iter()
            .filter_map(Result::ok)
            .filter(move |entry| {
                // 直接用高效的 ends_with 判断，避免了构建 Pattern 对象和复杂的匹配
                entry.file_name().to_string_lossy().ends_with(suffix)
            })
            .map(|entry| entry.path().to_string_lossy().into_owned())
            .collect()
    } else if input.contains('*') || input.contains('?') || input.contains('[') {
        // --- 保持原有的通用 glob 匹配路径 ---
        let pattern = match Pattern::new(input) {
            Ok(p) => p,
            Err(e) => return Err(common_err!("无效的 glob 模式: {}", e)),
        };

        walker
            .into_iter()
            .filter_map(Result::ok)
            .filter(move |entry| {
                entry
                    .file_name()
                    .to_str()
                    .map_or(false, |s| pattern.matches(s))
            })
            .map(|entry| entry.path().to_string_lossy().into_owned())
            .collect()
    } else {
        // --- 保持原有的精确匹配路径 ---
        let exact_name = std::ffi::OsStr::new(input);

        walker
            .into_iter()
            .filter_map(Result::ok)
            .filter(move |entry| entry.file_name() == exact_name)
            .map(|entry| entry.path().to_string_lossy().into_owned())
            .collect()
    };

    // 4. 从结果中获取文件数量
    let count = search_result.len();
    // 5. 计算总耗时
    let elapsed = start_time.elapsed();
    let spent_seconds = elapsed.as_millis();

    // 6. 构建 QuickFindRespond 结构体并返回
    Ok(QuickFindRespond {
        vec: search_result,
        count, // 注意这里的类型转换
        spent_millis: spent_seconds,
    })
}
