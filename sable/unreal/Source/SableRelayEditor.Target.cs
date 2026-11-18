using UnrealBuildTool;

public class SableRelayEditorTarget : TargetRules
{
    public SableRelayEditorTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Editor;
        DefaultBuildSettings = BuildSettingsVersion.V5;
        IncludeOrderVersion = EngineIncludeOrderVersion.Unreal5_5;
        ExtraModuleNames.Add("SableRelay");
    }
}
